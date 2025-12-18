import { Platform } from 'react-native';

// 火山引擎图生图服务
export interface VolcanoImageGenerationRequest {
  model: string;
  prompt: string;
  image?: string[];
  sequential_image_generation?: 'auto' | 'manual';
  sequential_image_generation_options?: {
    max_images: number;
  };
  response_format?: 'url' | 'b64_json';
  size?: '3:4' | '9:16' | '1:1';
  stream?: boolean;
  watermark?: boolean;
  optimize_prompt_options?: {
    mode: string;
  };
}

export interface VolcanoStreamChunk {
  id: string;
  object: string;
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface VolcanoImageGenerationResponse {
  id: string;
  object: string;
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface VolcanoImageGenerationOptions {
  onSuccess?: (result: VolcanoImageGenerationResponse) => void;
  onError?: (error: Error) => void;
  onProgress?: (loaded: number, total: number) => void;
  onStreamChunk?: (chunk: VolcanoStreamChunk) => void;
}

class VolcanoImageService {
  private readonly baseURL = process.env.EXPO_PUBLIC_AIPA_API_DOMAIN || process.env.AIPA_API_DOMAIN || '';

  async generateImages(
    request: VolcanoImageGenerationRequest,
    options?: VolcanoImageGenerationOptions
  ): Promise<VolcanoImageGenerationResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[VolcanoImageService] 开始生成图片:', {
        model: request.model,
        prompt: request.prompt,
        imageCount: request.image?.length || 0,
        streamEnabled: request.stream
      });

      // 如果开启流式模式，使用SSE接口
      if (request.stream && options?.onStreamChunk) {
        return this.generateImagesStream(request, options);
      }

      // 构建火山引擎API请求体 - 直接发送原始尺寸，让服务端处理转换
      const requestBody: any = {
        model: request.model,
        prompt: request.prompt,
        response_format: request.response_format || 'url',
        size: request.size || '1:1',
        watermark: request.watermark !== undefined ? request.watermark : true
      };

      // SeedDream 3.0 模型不支持 stream 参数，需要移除
      if (request.model !== 'doubao-seedream-3-0-t2i-250415') {
        requestBody.stream = request.stream || false;
      }

      // 如果有参考图片，添加image参数和多图生成设置
      if (request.image && request.image.length > 0) {
        requestBody.image = request.image;
      }
      
      // 无论是否有参考图，都要设置多图生成参数
      requestBody.sequential_image_generation = request.sequential_image_generation || 'auto';
      requestBody.sequential_image_generation_options = request.sequential_image_generation_options || {
        max_images: 4 // 默认生成1张图
      };

      // 添加提示词优化参数
      if (request.optimize_prompt_options) {
        requestBody.optimize_prompt_options = request.optimize_prompt_options;
      }

      // 通过服务端API调用火山引擎
      const response = await fetch(`${this.baseURL}/api/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '未知错误' }));
        console.error('[VolcanoImageService] API请求失败:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        // 根据不同的错误类型提供更友好的错误信息
        let errorMessage = '图生图请求失败';
        if (errorData.error) {
          if (errorData.error.includes('网络请求失败')) {
            errorMessage = '网络连接失败，请检查网络连接后重试';
          } else if (errorData.error.includes('火山引擎API响应解析失败')) {
            errorMessage = '服务暂时不可用，请稍后重试';
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else {
            errorMessage = errorData.error;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;

      console.log('[VolcanoImageService] 图片生成成功:', {
        id: data.id,
        imageCount: data.data?.length || 0,
        duration: `${duration}ms`,
        model: data.model
      });

      // 调用进度回调
      if (options?.onProgress) {
        options.onProgress(100, 100);
      }

      return data;
    } catch (error) {
      console.error('[VolcanoImageService] 生成图片失败:', error);
      throw error;
    }
  }

  // 新增：流式生成方法
  private async generateImagesStream(
    request: VolcanoImageGenerationRequest,
    options: VolcanoImageGenerationOptions
  ): Promise<VolcanoImageGenerationResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[VolcanoImageService] 开始流式生成图片');
      
      // 构建请求体
      const requestBody: any = {
        model: request.model,
        prompt: request.prompt,
        response_format: request.response_format || 'url',
        size: request.size || '1:1',
        watermark: request.watermark !== undefined ? request.watermark : true,
        stream: true
      };
      
      if (request.image && request.image.length > 0) {
        requestBody.image = request.image;
      }
      
      requestBody.sequential_image_generation = request.sequential_image_generation || 'auto';
      requestBody.sequential_image_generation_options = request.sequential_image_generation_options || {
        max_images: 4
      };
      
      if (request.optimize_prompt_options) {
        requestBody.optimize_prompt_options = request.optimize_prompt_options;
      }
      
      console.log('[VolcanoImageService] 发送流式请求到:', `${this.baseURL}/api/images/generations-stream`);
      console.log('[VolcanoImageService] 流式请求参数:', JSON.stringify(requestBody, null, 2));
      
      // 调用SSE接口
      const response = await fetch(`${this.baseURL}/api/images/generations-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[VolcanoImageService] 流式响应状态:', response.status);
      console.log('[VolcanoImageService] 流式响应头:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VolcanoImageService] 流式API调用失败:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`流式API调用失败: ${response.status} ${response.statusText}`);
      }
      
      // 处理SSE响应 - 兼容React Native环境
      console.log('[VolcanoImageService] 开始处理SSE响应，平台:', Platform.OS);
      
      // 统一使用文本方式处理流式响应，确保兼容性
      return this.handleStreamAsText(response, options);
      
    } catch (error) {
      console.error('[VolcanoImageService] 流式生成失败:', error);
      throw error;
    }
  }

  // 统一的流式响应文本处理方法（兼容RN和Web降级场景）
  private async handleStreamAsText(
    response: Response,
    options: VolcanoImageGenerationOptions
  ): Promise<VolcanoImageGenerationResponse> {
    console.log('[VolcanoImageService] 使用流式读取器处理响应');
    
    const reader = response.body?.getReader();
    if (!reader) {
      console.error('[VolcanoImageService] 无法获取流式响应读取器。response.body:', response.body);
      throw new Error('无法获取流式响应读取器');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: any = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[VolcanoImageService] 流式响应读取完成');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last, possibly incomplete, line

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '' || !trimmedLine.startsWith('data:')) {
            continue;
          }

          const data = trimmedLine.slice(trimmedLine.startsWith('data: ') ? 6 : 5);

          if (data.trim() === '[DONE]') {
            console.log('[VolcanoImageService] 收到流式结束标记');
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.error || parsed.message) {
              console.error('[VolcanoImageService] 流式响应错误:', parsed);
              throw new Error(parsed.message || parsed.error || '流式生成失败');
            }
            
            if (parsed.data && parsed.data.length > 0) {
              finalResult = parsed; // Keep track of the latest valid data chunk
              if (options.onStreamChunk) {
                console.log('[VolcanoImageService] 调用流式回调，图片数量:', parsed.data.length);
                options.onStreamChunk(parsed); // Callback for each chunk
              }
            }
          } catch (parseError) {
            console.warn('[VolcanoImageService] 流式数据解析失败:', {
              data: data.substring(0, 200),
              error: parseError instanceof Error ? parseError.message : String(parseError)
            });
            // Continue processing other lines
          }
        }
      }
    } catch (streamError) {
      console.error('[VolcanoImageService] 流式读取循环发生错误:', streamError);
      throw streamError;
    } finally {
      reader.releaseLock();
    }
    
    if (!finalResult) {
      console.error('[VolcanoImageService] 流式响应未收到有效的图片数据。完整缓冲区内容:', buffer);
      throw new Error('流式响应未收到有效的图片数据');
    }
    
    console.log('[VolcanoImageService] 流式处理成功，返回最终结果:', {
      id: finalResult.id,
      dataLength: finalResult.data?.length || 0
    });
    
    return finalResult;
  }

  // 预设的常用模型配置
  getModelConfigs() {
    return {
      seedream4: {
        id: 'doubao-seedream-4-0-250828',
        name: 'SeedDream 4.0',
        description: '高质量图生图模型，支持多种风格转换',
        supportedSizes: ['3:4', '9:16', '1:1'],
        maxImages: 4
      },
      seedream3: {
        id: 'doubao-seedream-3-0-t2i-250415',
        name: 'SeedDream 3.0',
        description: '高效图生图模型，快速生成稳定效果',
        supportedSizes: ['3:4', '9:16', '1:1'],
        maxImages: 4
      },
    };
  }

  // 验证请求参数
  validateRequest(request: VolcanoImageGenerationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push('请输入图片描述');
    }

    if (request.prompt && request.prompt.length > 1000) {
      errors.push('描述文字不能超过1000字符');
    }

    if (!request.model) {
      errors.push('请选择生成模型');
    }

    const modelConfigs = this.getModelConfigs();
    const modelConfig = Object.values(modelConfigs).find(config => config.id === request.model);
    
    if (!modelConfig) {
      errors.push('不支持的模型');
    }

    if (request.size && modelConfig && !modelConfig.supportedSizes.includes(request.size)) {
      errors.push(`模型 ${modelConfig.name} 不支持尺寸 ${request.size}`);
    }

    if (request.image && request.image.length > 0) {
      if (request.image.length > 4) {
        errors.push('最多支持4张参考图片');
      }

      // 验证图片URL格式
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
      for (const imageUrl of request.image) {
        if (!urlPattern.test(imageUrl)) {
          errors.push(`无效的图片URL: ${imageUrl}`);
        }
      }
    }

    const maxImages = request.sequential_image_generation_options?.max_images || 1;
    if (maxImages > 4) {
      errors.push('最多生成4张图片');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 获取预设提示词模板
  getPromptTemplates() {
    return [
      {
        category: '人物写真',
        templates: [
          '将这张照片转换为专业的商业肖像照风格',
          '将人物照片转换为动漫卡通风格',
          '为这张照片添加专业的艺术光影效果'
        ]
      },
      {
        category: '产品展示',
        templates: [
          '将产品图片转换为高端商业摄影风格',
          '为产品添加简洁干净的背景',
          '将产品照片转换为3D渲染风格'
        ]
      },
      {
        category: '风景美化',
        templates: [
          '将风景照片转换为油画艺术风格',
          '为风景照片添加梦幻般的光影效果',
          '将风景照片转换为水彩画风格'
        ]
      }
    ];
  }
}

export const volcanoImageService = new VolcanoImageService();
