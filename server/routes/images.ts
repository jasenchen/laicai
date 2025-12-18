import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// 工具函数：下载图片到base64
async function downloadImageToBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`[Images API] 开始下载图片: ${imageUrl}`);
    
    // 设置超时时间为60秒（增加超时时间）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // 检查图片大小（限制为8MB以减少处理时间）
    if (uint8Array.length > 8 * 1024 * 1024) {
      throw new Error('图片文件过大，超过8MB限制');
    }
    
    // 使用更高效的base64编码方法
    const base64 = arrayBufferToBase64(arrayBuffer);
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log(`[Images API] 图片下载成功，大小: ${(uint8Array.length / 1024).toFixed(2)}KB`);
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`[Images API] 图片下载失败: ${imageUrl}`, error);
    let errorMessage = '未知错误';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = '下载超时，可能是图片较大或网络较慢，请重试';
      } else {
        errorMessage = error.message;
      }
    }
    
    throw new Error(`图片下载失败: ${errorMessage}`);
  }
}

// 优化的base64编码函数
function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  const bytes = uint8Array.byteLength;
  const chunkSize = 0x8000; // 32KB chunks
  
  for (let i = 0; i < bytes; i += chunkSize) {
    binary += String.fromCharCode.apply(null, 
      Array.from(uint8Array.subarray(i, Math.min(i + chunkSize, bytes)))
    );
  }
  
  return btoa(binary);
}

const imagesRouter = new Hono();

// 生成图片的请求验证schema
const generateImageSchema = z.object({
  model: z.string(),
  prompt: z.string().min(1).max(1000),
  image: z.array(z.string().url()).max(4).optional(),
  sequential_image_generation: z.enum(['auto', 'manual']).optional(),
  sequential_image_generation_options: z.object({
    max_images: z.number().min(1).max(4).default(1),
  }).optional(),
  response_format: z.enum(['url', 'b64_json']).default('url'),
  size: z.enum(['3:4', '9:16', '1:1']).default('1:1'),
  stream: z.boolean().default(false),
  watermark: z.boolean().default(true),
  optimize_prompt_options: z.object({
    mode: z.string().default('fast')
  }).optional(),
});

// 模拟图片生成接口（用于调试）
imagesRouter.post('/generations-mock', zValidator('json', generateImageSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    
    console.log('[Images API] 模拟图片生成请求:', {
      model: body.model,
      prompt: body.prompt.substring(0, 100) + '...',
      imageCount: body.image?.length || 0,
      size: body.size,
      watermark: body.watermark
    });

    // 返回模拟响应
    const mockResponse = {
      id: `mock_${Date.now()}`,
      object: 'images/generation',
      created: Math.floor(Date.now() / 1000),
      data: [
        {
          url: 'https://cdn-tos-cn.bytedance.net/obj/aipa-tos/68c968de-b2ca-4c86-ae7f-4e85afa0efa1/yuebing.png',
          revised_prompt: body.prompt
        }
      ],
      model: body.model,
      usage: {
        prompt_tokens: 50,
        completion_tokens: 0,
        total_tokens: 50
      }
    };

    return c.json(mockResponse);
    
  } catch (error) {
    console.error('[Images API] 模拟生成失败:', error);
    return c.json({ 
      error: '模拟图片生成失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, 500);
  }
});

// 流式生成接口 (Server-Sent Events)
imagesRouter.post('/generations-stream', zValidator('json', generateImageSchema), async (c) => {
  const startTime = Date.now();
  const requestId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const body = c.req.valid('json');
    
    console.log(`[Images API] [${requestId}] ========== 开始流式图片生成请求 ==========`,);
    
    // 构建火山引擎API请求体
    const volcanoRequestBody: any = {
      model: body.model,
      prompt: body.prompt,
      response_format: body.response_format || 'url',
      watermark: body.watermark !== undefined ? body.watermark : true,
      stream: true // 强制开启流式
    };
    
    // 根据不同模型设置不同的尺寸参数
    if (body.model === 'doubao-seedream-3-0-t2i-250415') {
      volcanoRequestBody.size = body.size === '3:4' ? '768x1024' : 
                               body.size === '9:16' ? '576x1024' : 
                               '1024x1024';
    } else {
      volcanoRequestBody.size = body.size === '3:4' ? '1728x2304' : 
                               body.size === '9:16' ? '1440x2560' : 
                               '2048x2048';
    }
    
    // 设置多图生成参数
    volcanoRequestBody.sequential_image_generation = body.sequential_image_generation || 'auto';
    if (body.sequential_image_generation_options) {
      volcanoRequestBody.sequential_image_generation_options = {
        max_images: Math.min(body.sequential_image_generation_options.max_images, 4)
      };
    }
    
    // 处理参考图片
    if (body.image && body.image.length > 0) {
      const downloadedImages: string[] = [];
      
      for (let i = 0; i < Math.min(body.image.length, 4); i++) {
        try {
          const base64Image = await downloadImageToBase64(body.image[i]);
          downloadedImages.push(base64Image);
        } catch (downloadError) {
          console.error(`[Images API] [${requestId}] 第 ${i + 1} 张图片下载失败:`, downloadError);
          if (i === 0) {
            throw downloadError;
          }
        }
      }
      
      if (downloadedImages.length > 0) {
        volcanoRequestBody.image = downloadedImages;
      }
    }
    
    console.log(`[Images API] [${requestId}] 发送流式请求到火山引擎`);
    console.log(`[Images API] [${requestId}] 请求体:`, JSON.stringify(volcanoRequestBody, null, 2));
    
    // 调用火山引擎API
    const apiKey = 'b925a0d3-bac0-4725-a18a-d7de9da9a154';
    const volcanoResponse = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(volcanoRequestBody),
    });
    
    console.log(`[Images API] [${requestId}] 火山引擎响应状态: ${volcanoResponse.status}`);
    console.log(`[Images API] [${requestId}] 响应头:`, Object.fromEntries(volcanoResponse.headers.entries()));
    
    if (!volcanoResponse.ok) {
      const errorText = await volcanoResponse.text();
      console.error(`[Images API] [${requestId}] 火山引擎API调用失败:`, {
        status: volcanoResponse.status,
        statusText: volcanoResponse.statusText,
        errorText
      });
      throw new Error(`火山引擎API调用失败: ${volcanoResponse.status} ${volcanoResponse.statusText}`);
    }
    
    // 检查响应类型
    const contentType = volcanoResponse.headers.get('content-type');
    console.log(`[Images API] [${requestId}] 火山引擎响应类型: ${contentType}`);
    
    // 正确的流式处理方式：直接将火山引擎的响应体作为返回值
    // Hono/底层环境会自动处理流的转发
    
    // 设置SSE响应头
    c.header('Content-Type', 'text/event-stream; charset=utf-8');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('Access-Control-Allow-Origin', '*');
    
    return new Response(volcanoResponse.body, {
      status: volcanoResponse.status,
      statusText: volcanoResponse.statusText,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
    
  } catch (error) {
    console.error(`[Images API] [${requestId}] 流式生成失败:`, error);
    return c.json({
      error: '流式生成失败',
      message: error instanceof Error ? error.message : '未知错误',
      requestId: requestId
    }, 500);
  }
});

// 真实的图片生成接口
imagesRouter.post('/generations', zValidator('json', generateImageSchema), async (c) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const body = c.req.valid('json');
    
    // 详细记录请求参数
    console.log(`[Images API] [${requestId}] ========== 开始处理图片生成请求 ==========`,);
    console.log(`[Images API] [${requestId}] 请求参数详情:`);
    console.log(`[Images API] [${requestId}]   - 模型: ${body.model}`);
    console.log(`[Images API] [${requestId}]   - 提示词: ${body.prompt.substring(0, 200)}${body.prompt.length > 200 ? '...' : ''}`);
    console.log(`[Images API] [${requestId}]   - 提示词长度: ${body.prompt.length} 字符`);
    console.log(`[Images API] [${requestId}]   - 参考图片数量: ${body.image?.length || 0}`);
    if (body.image && body.image.length > 0) {
      body.image.forEach((img, index) => {
        console.log(`[Images API] [${requestId}]   - 参考图片${index + 1}: ${img.substring(0, 100)}...`);
      });
    }
    console.log(`[Images API] [${requestId}]   - 尺寸比例: ${body.size}`);
    console.log(`[Images API] [${requestId}]   - 响应格式: ${body.response_format}`);
    console.log(`[Images API] [${requestId}]   - 流式输出: ${body.stream}`);
    console.log(`[Images API] [${requestId}]   - 水印: ${body.watermark}`);
    console.log(`[Images API] [${requestId}]   - 顺序生成模式: ${body.sequential_image_generation || 'auto'}`);
    console.log(`[Images API] [${requestId}]   - 最大生成图片数: ${body.sequential_image_generation_options?.max_images || 1}`);
    console.log(`[Images API] [${requestId}]   - 优化提示词选项:`, body.optimize_prompt_options);
    console.log(`[Images API] [${requestId}]   - 请求时间: ${new Date().toISOString()}`);

    // 调用火山引擎API
    const apiKey = 'b925a0d3-bac0-4725-a18a-d7de9da9a154';
    
    // 构建火山引擎API请求体 - 根据模型使用不同的尺寸参数
    const volcanoRequestBody: any = {
      model: body.model,
      prompt: body.prompt,
      response_format: body.response_format,
      watermark: body.watermark
    };
    
    // 根据不同模型设置不同的尺寸参数
    if (body.model === 'doubao-seedream-3-0-t2i-250415') {
      // SeedDream 3.0 模型的尺寸参数
      volcanoRequestBody.size = body.size === '3:4' ? '768x1024' : 
                               body.size === '9:16' ? '576x1024' : 
                               '1024x1024';
      // SeedDream 3.0 支持流式输出，移除之前的限制
      if (body.stream) {
        volcanoRequestBody.stream = true;
      }
    } else {
      // SeedDream 4.0 模型的尺寸参数
      volcanoRequestBody.size = body.size === '3:4' ? '1728x2304' : 
                               body.size === '9:16' ? '1440x2560' : 
                               '2048x2048';
      // 设置流式参数
      if (body.stream) {
        volcanoRequestBody.stream = true;
      }
    }
    
    // 设置多图生成参数（无论是否有参考图）
    volcanoRequestBody.sequential_image_generation = body.sequential_image_generation || 'auto';
    if (body.sequential_image_generation_options) {
      volcanoRequestBody.sequential_image_generation_options = {
        max_images: Math.min(body.sequential_image_generation_options.max_images, 4)
      };
    }
    
    // 添加优化提示词选项
    if (body.optimize_prompt_options) {
      volcanoRequestBody.optimize_prompt_options = body.optimize_prompt_options;
    }
    
    // 记录转换后的参数
    console.log(`[Images API] [${requestId}] 参数转换完成:`);
    console.log(`[Images API] [${requestId}]   - 最终尺寸: ${volcanoRequestBody.size}`);
    console.log(`[Images API] [${requestId}]   - 流式输出: ${volcanoRequestBody.stream || false}`);
    console.log(`[Images API] [${requestId}]   - 优化提示词: ${JSON.stringify(volcanoRequestBody.optimize_prompt_options)}`);
    
    // 只有在有参考图片时才添加相关参数
    if (body.image && body.image.length > 0 && body.image.length <= 4) {
      console.log(`[Images API] [${requestId}] 开始处理参考图片...`);
      try {
        // 下载图片并转换为base64
        const downloadedImages: string[] = [];
        
        for (let i = 0; i < body.image.length; i++) {
          const imageUrl = body.image[i];
          const imageStartTime = Date.now();
          try {
            console.log(`[Images API] [${requestId}] 处理第 ${i + 1} 张图片: ${imageUrl.substring(0, 100)}...`);
            const base64Image = await downloadImageToBase64(imageUrl);
            downloadedImages.push(base64Image);
            const imageProcessTime = Date.now() - imageStartTime;
            console.log(`[Images API] [${requestId}] 第 ${i + 1} 张图片处理成功，耗时: ${imageProcessTime}ms`);
          } catch (downloadError) {
            const imageProcessTime = Date.now() - imageStartTime;
            console.error(`[Images API] [${requestId}] 第 ${i + 1} 张图片下载失败，耗时: ${imageProcessTime}ms`, downloadError);
            
            // 如果是第一张图片下载失败，抛出错误
            if (i === 0) {
              throw downloadError;
            }
            
            // 如果不是第一张图片，跳过这张图片但继续处理其他图片
            console.warn(`[Images API] [${requestId}] 跳过第 ${i + 1} 张图片，继续处理其他图片`);
          }
        }
        
        if (downloadedImages.length === 0) {
          throw new Error('所有参考图片都下载失败，请检查图片链接是否有效');
        }
        
        volcanoRequestBody.image = downloadedImages;
        
        console.log(`[Images API] [${requestId}] 图片处理完成: 成功下载并转换 ${downloadedImages.length}/${body.image.length} 张图片为base64格式`);
      } catch (downloadError) {
        console.error(`[Images API] [${requestId}] 图片下载失败:`, downloadError);
        return c.json({
          error: '图片下载失败',
          message: downloadError instanceof Error ? downloadError.message : '图片下载过程中发生错误',
          suggestion: '请检查图片链接是否有效，或尝试使用较小的图片文件',
          requestId: requestId
        }, 400);
      }
    }
    
    console.log(`[Images API] [${requestId}] 准备发送到火山引擎的完整请求体:`);
    console.log(`[Images API] [${requestId}] ${JSON.stringify(volcanoRequestBody, null, 2)}`);

    const apiCallStartTime = Date.now();
    let volcanoResponse: Response;
    try {
      console.log(`[Images API] [${requestId}] 开始调用火山引擎API...`);
      volcanoResponse = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(volcanoRequestBody),
      });
      const apiCallTime = Date.now() - apiCallStartTime;
      console.log(`[Images API] [${requestId}] 火山引擎API调用完成，耗时: ${apiCallTime}ms，状态码: ${volcanoResponse.status}`);
    } catch (fetchError) {
      const apiCallTime = Date.now() - apiCallStartTime;
      console.error(`[Images API] [${requestId}] 网络请求失败，耗时: ${apiCallTime}ms`, fetchError);
      return c.json({ 
        error: '网络请求失败',
        message: fetchError instanceof Error ? fetchError.message : '无法连接到火山引擎API',
        requestId: requestId
      }, 500);
    }

    if (!volcanoResponse.ok) {
      const errorText = await volcanoResponse.text();
      console.error(`[Images API] [${requestId}] 火山引擎API请求失败:`);
      console.error(`[Images API] [${requestId}]   - 状态码: ${volcanoResponse.status}`);
      console.error(`[Images API] [${requestId}]   - 状态文本: ${volcanoResponse.statusText}`);
      console.error(`[Images API] [${requestId}]   - 错误详情: ${errorText}`);
      console.error(`[Images API] [${requestId}]   - 请求体: ${JSON.stringify(volcanoRequestBody)}`);
      
      // 尝试解析错误详情
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.error?.message || errorJson.message || errorText;
      } catch {
        // 如果不是JSON格式，使用原始错误文本
      }
      
      return c.json({ 
        error: '火山引擎API调用失败',
        message: `${volcanoResponse.status} ${volcanoResponse.statusText}`,
        detail: errorDetail,
        requestId: requestId
      }, 502);
    }

    // 处理流式响应
    if (body.stream) {
      console.log(`[Images API] [${requestId}] 检测到流式响应，开始处理...`);
      
      try {
        // 检查响应类型
        const contentType = volcanoResponse.headers.get('content-type');
        console.log(`[Images API] [${requestId}] 响应Content-Type: ${contentType}`);
        
        if (contentType?.includes('text/event-stream')) {
          // 处理Server-Sent Events格式
          const reader = volcanoResponse.body?.getReader();
          if (!reader) {
            throw new Error('无法获取流式响应读取器');
          }

          const decoder = new TextDecoder();
          let buffer = '';
          let finalResult: any = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一行可能不完整的内容

            for (const line of lines) {
              if (line.trim() === '') continue;
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data.trim() === '[DONE]') {
                  console.log(`[Images API] [${requestId}] 流式响应完成`);
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  console.log(`[Images API] [${requestId}] 流式数据块:`, JSON.stringify(parsed, null, 2));
                  
                  // 更新最终结果
                  if (parsed.data && parsed.data.length > 0) {
                    finalResult = parsed;
                    
                    // 对于流式响应，我们直接返回数据块
                    // 前端会通过SSE接收实时数据
                    console.log(`[Images API] [${requestId}] 检测到流式数据，包含 ${parsed.data?.length || 0} 张图片`);
                  }
                } catch (parseError) {
                  console.warn(`[Images API] [${requestId}] 流式数据解析失败:`, parseError);
                }
              }
            }
          }

          if (!finalResult) {
            throw new Error('流式响应未收到有效数据');
          }

          const totalTime = Date.now() - startTime;
          console.log(`[Images API] [${requestId}] 流式响应处理成功:`);
          console.log(`[Images API] [${requestId}]   - 生成ID: ${finalResult.id}`);
          console.log(`[Images API] [${requestId}]   - 生成图片数量: ${finalResult.data?.length || 0}`);
          console.log(`[Images API] [${requestId}]   - 使用模型: ${finalResult.model}`);
          console.log(`[Images API] [${requestId}]   - 总处理时间: ${totalTime}ms`);
          console.log(`[Images API] [${requestId}] ========== 流式图片生成请求处理完成 ==========`);

          return c.json(finalResult);
        } else {
          // 不是流式响应，按普通响应处理
          console.log(`[Images API] [${requestId}] 期望流式响应但收到普通响应，按非流式处理`);
          
          let volcanoData: any;
          try {
            const responseText = await volcanoResponse.text();
            console.log(`[Images API] [${requestId}] 火山引擎API响应原始内容(前500字符): ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
            
            if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
              throw new Error('API返回的不是有效的JSON格式，可能是错误页面');
            }
            
            volcanoData = JSON.parse(responseText);
          } catch (parseError) {
            console.error(`[Images API] [${requestId}] JSON解析失败:`, parseError);
            return c.json({ 
              error: '火山引擎API响应解析失败',
              message: parseError instanceof Error ? parseError.message : '响应格式错误',
              suggestion: '请检查API密钥是否正确，或联系技术支持',
              requestId: requestId
            }, 500);
          }
          
          const totalTime = Date.now() - startTime;
          console.log(`[Images API] [${requestId}] 按非流式处理成功:`);
          console.log(`[Images API] [${requestId}]   - 生成ID: ${volcanoData.id}`);
          console.log(`[Images API] [${requestId}]   - 生成图片数量: ${volcanoData.data?.length || 0}`);
          console.log(`[Images API] [${requestId}]   - 使用模型: ${volcanoData.model}`);
          console.log(`[Images API] [${requestId}]   - 总处理时间: ${totalTime}ms`);
          console.log(`[Images API] [${requestId}] ========== 图片生成请求处理完成 ==========`);

          return c.json(volcanoData);
        }

      } catch (streamError) {
        console.error(`[Images API] [${requestId}] 流式响应处理失败:`, streamError);
        return c.json({
          error: '流式响应处理失败',
          message: streamError instanceof Error ? streamError.message : '未知错误',
          requestId: requestId
        }, 500);
      }
    }
    
    // 处理非流式响应
    let volcanoData: any;
    try {
      const responseText = await volcanoResponse.text();
      console.log(`[Images API] [${requestId}] 火山引擎API响应原始内容(前500字符): ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
      
      // 检查响应是否是JSON格式
      if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
        throw new Error('API返回的不是有效的JSON格式，可能是错误页面');
      }
      
      volcanoData = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[Images API] [${requestId}] JSON解析失败:`, parseError);
      return c.json({ 
        error: '火山引擎API响应解析失败',
        message: parseError instanceof Error ? parseError.message : '响应格式错误',
        suggestion: '请检查API密钥是否正确，或联系技术支持',
        requestId: requestId
      }, 500);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[Images API] [${requestId}] 火山引擎API调用成功:`);
    console.log(`[Images API] [${requestId}]   - 生成ID: ${volcanoData.id}`);
    console.log(`[Images API] [${requestId}]   - 生成图片数量: ${volcanoData.data?.length || 0}`);
    console.log(`[Images API] [${requestId}]   - 使用模型: ${volcanoData.model}`);
    console.log(`[Images API] [${requestId}]   - 总处理时间: ${totalTime}ms`);
    console.log(`[Images API] [${requestId}] ========== 图片生成请求处理完成 ==========`);

    return c.json(volcanoData);
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Images API] [${requestId}] 生成失败，总耗时: ${totalTime}ms:`, error);
    return c.json({ 
      error: '图片生成失败',
      message: error instanceof Error ? error.message : '未知错误',
      requestId: requestId
    }, 500);
  }
});

// 获取生成历史
imagesRouter.get('/history', async (c) => {
  try {
    // 这里应该从数据库查询历史记录
    const mockHistory = [
      {
        id: 'hist_1',
        prompt: '一个美丽的山水画',
        model: 'doubao-seedream-4-0-250828',
        size: '2K',
        watermark: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed' as const,
        generatedImages: [
          'https://cdn-tos-cn.bytedance.net/obj/aipa-tos/2ed6e41f-4013-4ecf-9d3b-47361ba91104/img-pyq.png'
        ]
      }
    ];

    return c.json({
      data: mockHistory,
      total: mockHistory.length
    });
    
  } catch (error) {
    console.error('[Images API] 获取历史失败:', error);
    return c.json({ 
      error: '获取历史失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, 500);
  }
});

// 获取模型配置
imagesRouter.get('/models', async (c) => {
  try {
    const models = [
      {
        id: 'doubao-seedream-4-0-250828',
        name: 'SeedDream 4.0',
        description: '高质量图生图模型，支持多种风格转换',
        supportedSizes: ['3:4', '9:16', '1:1'],
        maxImages: 4
      },
      {
        id: 'doubao-seedream-3-0-t2i-250415',
        name: 'SeedDream 3.0',
        description: '高效图生图模型，快速生成稳定效果',
        supportedSizes: ['3:4', '9:16', '1:1'],
        maxImages: 4
      }
    ];

    return c.json({ data: models });
    
  } catch (error) {
    console.error('[Images API] 获取模型失败:', error);
    return c.json({ 
      error: '获取模型失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, 500);
  }
});

export { imagesRouter };
