import { 
  volcanoImageService, 
  VolcanoImageGenerationRequest, 
  VolcanoImageGenerationResponse 
} from './volcanoImageService';
import { AspectRatio } from '@/types/aspectRatio';
// 静态导入确保在iOS端正常工作
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface PosterGenerationRequest {
  prompt: string;
  referenceImages: string[];
  aspectRatio: AspectRatio;
  style?: string;
  parallelImageCount?: number;
  responseFormat?: 'url' | 'base64';
  optimizePromptOptions?: {
    mode: string;
  };
}

export interface PosterGenerationResponse {
  id: string;
  images: string[];
  aspectRatio: AspectRatio;
  prompt: string;
  timestamp: number;
  responseFormat?: 'url' | 'base64';
}

export interface PosterGenerationOptions {
  onSuccess?: (result: PosterGenerationResponse) => void;
  onError?: (error: Error) => void;
  onProgress?: (loaded: number, total: number) => void;
  onStreamChunk?: (chunk: any) => void;
}

class PosterGenerationService {
  private readonly baseURL = process.env.EXPO_PUBLIC_AIPA_API_DOMAIN || process.env.AIPA_API_DOMAIN || '';

  async generatePoster(
    request: PosterGenerationRequest,
    options?: PosterGenerationOptions
  ): Promise<PosterGenerationResponse> {
    const startTime = Date.now();
    
    try {
      const imageCount = request.parallelImageCount || 4;
      
      console.log('[PosterGenerationService] 开始生成海报:', {
        style: request.style,
        aspectRatio: request.aspectRatio.name,
        dimensions: request.aspectRatio.dimensions,
        referenceImageCount: request.referenceImages.length,
        parallelImageCount: imageCount
      });

      const enhancedPrompt = request.prompt;
      
      // 构建基础请求参数
      const baseRequest: any = {
        model: 'doubao-seedream-4-0-250828', // 使用seedream 4.0
        prompt: enhancedPrompt,
        image: request.referenceImages.length > 0 ? request.referenceImages : undefined,
        size: this.getVolcanoSize(request.aspectRatio),
        watermark: false,
        sequential_image_generation: 'auto',
        sequential_image_generation_options: {
          max_images: 4 // 固定4次并行生成
        },
        optimize_prompt_options: request.optimizePromptOptions || {
          mode: 'fast'
        }
      };
      
      // 根据返回格式添加相应参数
      if (request.responseFormat === 'base64') {
        baseRequest.response_format = 'b64_json';
      }
      
      const volcanoRequest: VolcanoImageGenerationRequest = baseRequest;

      // 验证请求参数
      const validation = volcanoImageService.validateRequest(volcanoRequest);
      if (!validation.valid) {
        throw new Error(validation.errors.join('\n'));
      }

      const response: VolcanoImageGenerationResponse = 
        await volcanoImageService.generateImages(volcanoRequest, {
          onProgress: options?.onProgress,
          onStreamChunk: options?.onStreamChunk
        });

      if (response.data && response.data.length > 0) {
        const images = response.data
          .filter(item => {
            // 根据返回格式过滤
            if (request.responseFormat === 'base64') {
              return item.b64_json; // Base64格式检查 b64_json 字段
            } else {
              return item.url; // URL格式检查 url 字段
            }
          })
          .map(item => {
            // 根据返回格式返回对应的字段
            if (request.responseFormat === 'base64') {
              return item.b64_json!;
            } else {
              return item.url!;
            }
          });

        const result: PosterGenerationResponse = {
          id: response.id,
          images,
          aspectRatio: request.aspectRatio,
          prompt: request.prompt,
          timestamp: Date.now(),
          responseFormat: request.responseFormat || 'url'
        };

        const duration = Date.now() - startTime;
        console.log('[PosterGenerationService] 海报生成成功:', {
          id: result.id,
          imageCount: images.length,
          duration: `${duration}ms`
        });

        options?.onSuccess?.(result);
        return result;
      } else {
        throw new Error('未收到生成的海报图片');
      }
    } catch (error) {
      console.error('[PosterGenerationService] 海报生成失败:', error);
      
      // 改进错误信息传递
      let errorMessage = '海报生成失败';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // 根据不同错误类型提供更好的用户提示
        if (error.message.includes('网络连接失败')) {
          errorMessage = '网络连接失败，请检查网络连接后重试';
        } else if (error.message.includes('服务暂时不可用')) {
          errorMessage = '服务暂时不可用，请稍后重试';
        } else if (error.message.includes('图片下载失败')) {
          errorMessage = '参考图片下载失败，请检查图片链接是否有效';
        }
      }
      
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  // 将AspectRatio转换为火山引擎支持的size格式 - 支持更多比例
  private getVolcanoSize(aspectRatio: AspectRatio): string {
    // 直接返回用户选择的比例，火山引擎支持更多比例格式
    return aspectRatio.ratio;
  }

  // 保存海报到相册
  async savePoster(imageUrl: string): Promise<void> {
    try {
      console.log('[PosterGenerationService] 开始保存海报:', imageUrl);

      // 检查是否为Base64格式
      if (imageUrl.startsWith('data:image/')) {
        console.log('[PosterGenerationService] 检测到Base64图片，使用Base64保存方法');
        await this.saveBase64Poster(imageUrl);
        return;
      }

      if (typeof window !== 'undefined' && window.document) {
        // Web端直接下载
        const link = window.document.createElement('a');
        link.href = imageUrl;
        link.download = `poster_${Date.now()}.png`;
        link.click();
        console.log('[PosterGenerationService] Web端海报保存成功');
      } else {
        // 移动端保存到相册
        console.log('[PosterGenerationService] 检测平台:', Platform.OS);
        // 检查和请求相册权限
        let permissionStatus;
        try {
          permissionStatus = await MediaLibrary.requestPermissionsAsync();
          console.log('[PosterGenerationService] 相册权限状态:', permissionStatus.status);
        } catch (permissionError) {
          console.error('[PosterGenerationService] 权限请求失败:', permissionError);
          throw new Error('无法获取相册权限，请检查应用权限设置');
        }
        
        if (permissionStatus.status !== 'granted') {
          throw new Error('需要相册权限才能保存海报，请在设置中允许访问相册');
        }

        // iOS端特殊处理
        if (Platform.OS === 'ios') {
          await this.savePosterForIOS(imageUrl);
        } else {
          await this.savePosterForAndroid(imageUrl);
        }
      }
    } catch (error) {
      console.error('[PosterGenerationService] 海报保存失败:', error);
      
      // 针对iOS特定错误提供更详细的提示
      if (error instanceof Error && error.message.includes('PHPhotosErrorDomain')) {
        throw new Error('iOS相册权限异常，请尝试：1) 重启应用 2) 在设置中重新授权相册权限 3) 检查存储空间');
      }
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('保存海报失败');
      }
    }
  }

  // 保存Base64格式海报
  private async saveBase64Poster(base64Data: string): Promise<void> {
    try {
      console.log('[PosterGenerationService] 开始保存Base64海报');

      // 提取Base64的MIME类型和实际数据
      const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Base64数据格式错误');
      }

      const mimeType = matches[1];
      const base64Content = matches[2];
      const extension = mimeType.split('/')[1] || 'png';

      console.log('[PosterGenerationService] 解析Base64:', {
        mimeType,
        extension,
        contentLength: base64Content.length
      });

      if (typeof window !== 'undefined' && window.document) {
        // Web端：创建下载链接
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        const link = window.document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `poster_${Date.now()}.${extension}`;
        link.click();
        
        // 清理URL
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
        
        console.log('[PosterGenerationService] Web端Base64海报保存成功');
      } else {
        // 移动端：保存到临时文件再保存到相册
        const fileName = `poster_${Date.now()}.${extension}`;
        const fileUri = FileSystem.cacheDirectory + fileName;

        // 将Base64数据写入文件
        await FileSystem.writeAsStringAsync(fileUri, base64Content, {
          encoding: FileSystem.EncodingType.Base64
        });

        console.log('[PosterGenerationService] Base64文件写入成功:', fileUri);

        // 验证文件是否存在
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error('Base64文件创建失败');
        }

        // 请求相册权限
        const permissionStatus = await MediaLibrary.requestPermissionsAsync();
        if (permissionStatus.status !== 'granted') {
          throw new Error('需要相册权限才能保存海报，请在设置中允许访问相册');
        }

        // 保存到相册
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        console.log('[PosterGenerationService] Base64海报已保存到相册，资源ID:', asset.id);

        // 清理临时文件
        try {
          await FileSystem.deleteAsync(fileUri);
          console.log('[PosterGenerationService] Base64临时文件已清理');
        } catch (cleanupError) {
          console.warn('[PosterGenerationService] 清理Base64临时文件失败:', cleanupError);
        }
      }
    } catch (error) {
      console.error('[PosterGenerationService] Base64海报保存失败:', error);
      throw error instanceof Error ? error : new Error('Base64海报保存失败');
    }
  }

  // iOS端海报保存专用方法
  private async savePosterForIOS(imageUrl: string): Promise<void> {
    console.log('[PosterGenerationService] iOS端保存海报:', imageUrl);
    
    try {
      // 验证图片URL是否有效
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('图片URL无效');
      }
      
      // 检查URL是否为有效的HTTP/HTTPS地址
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        throw new Error('图片URL格式无效');
      }
      
      console.log('[PosterGenerationService] 开始下载图片');
      
      // 使用expo-file-system下载图片，添加超时和重试机制
      const fileName = `poster_${Date.now()}.png`;
      const downloadOptions = {
        cacheKey: `poster_${Date.now()}`,
        md5: false
      };
      
      let downloadFile;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          downloadFile = await FileSystem.downloadAsync(imageUrl, FileSystem.cacheDirectory + fileName, downloadOptions);
          break; // 下载成功，跳出重试循环
        } catch (downloadError) {
          retryCount++;
          console.warn(`[PosterGenerationService] 下载尝试 ${retryCount} 失败:`, downloadError);
          
          if (retryCount > maxRetries) {
            throw new Error(`图片下载失败，已重试${maxRetries}次: ${downloadError instanceof Error ? downloadError.message : '未知错误'}`);
          }
          
          // 重试前等待1秒
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!downloadFile || downloadFile.status !== 200) {
        throw new Error(`图片下载失败，状态码: ${downloadFile?.status || 'unknown'}`);
      }
      
      console.log('[PosterGenerationService] 图片下载成功:', downloadFile.uri);
      
      // 验证文件是否存在且有内容
      const fileInfo = await FileSystem.getInfoAsync(downloadFile.uri);
      if (!fileInfo.exists) {
        throw new Error('下载的文件不存在');
      }
      
      if (!fileInfo.size || fileInfo.size === 0) {
        throw new Error('下载的文件为空');
      }
      
      console.log('[PosterGenerationService] 文件信息:', {
        uri: fileInfo.uri,
        size: fileInfo.size,
        exists: fileInfo.exists
      });
      
      // 保存到相册
      const asset = await MediaLibrary.createAssetAsync(downloadFile.uri);
      console.log('[PosterGenerationService] 海报已保存到相册，资源ID:', asset.id);
      
      // 清理临时文件
      try {
        await FileSystem.deleteAsync(downloadFile.uri);
        console.log('[PosterGenerationService] 临时文件已清理');
      } catch (cleanupError) {
        console.warn('[PosterGenerationService] 清理临时文件失败:', cleanupError);
      }
    } catch (error) {
      console.error('[PosterGenerationService] iOS端保存失败:', error);
      
      // 如果是权限错误，提供更详细的提示
      if (error instanceof Error) {
        if (error.message.includes('PHPhotosErrorDomain')) {
          throw new Error('iOS相册权限异常，请尝试：1) 重启应用 2) 在设置中重新授权相册权限 3) 检查存储空间');
        }
        
        // 如果是网络相关错误，提供更友好的提示
        if (error.message.includes('404') || error.message.includes('下载失败')) {
          throw new Error('图片无法下载，请检查网络连接或稍后重试');
        }
        
        throw error;
      } else {
        throw new Error('iOS端保存海报失败');
      }
    }
  }

  // Android端海报保存专用方法
  private async savePosterForAndroid(imageUrl: string): Promise<void> {
    console.log('[PosterGenerationService] Android端保存海报:', imageUrl);
    
    try {
      // 验证图片URL是否有效
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('图片URL无效');
      }
      
      // 检查URL是否为有效的HTTP/HTTPS地址
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        throw new Error('图片URL格式无效');
      }
      
      console.log('[PosterGenerationService] 开始下载图片');
      
      // 下载图片到本地，添加超时和重试机制
      let downloadResponse;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          // 创建兼容的超时控制器
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
          
          try {
            downloadResponse = await fetch(imageUrl, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'Expo-App',
              },
            });
            clearTimeout(timeoutId);
            break; // 下载成功，跳出重试循环
          } catch (fetchError) {
            clearTimeout(timeoutId);
            
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              throw new Error('图片下载超时');
            }
            throw fetchError;
          }
        } catch (downloadError) {
          retryCount++;
          console.warn(`[PosterGenerationService] 下载尝试 ${retryCount} 失败:`, downloadError);
          
          if (retryCount > maxRetries) {
            throw new Error(`图片下载失败，已重试${maxRetries}次: ${downloadError instanceof Error ? downloadError.message : '未知错误'}`);
          }
          
          // 重试前等待1秒
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!downloadResponse.ok) {
        throw new Error(`图片下载失败: ${downloadResponse.status} ${downloadResponse.statusText}`);
      }
      
      const imageBlob = await downloadResponse.arrayBuffer();
      console.log('[PosterGenerationService] 图片下载完成，大小:', imageBlob.byteLength);
      
      if (!imageBlob || imageBlob.byteLength === 0) {
        throw new Error('下载的图片为空');
      }
      
      // 保存到临时文件
      const fileName = `poster_${Date.now()}.png`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      // 将ArrayBuffer转换为Base64字符串
      const base64Data = Array.from(new Uint8Array(imageBlob))
        .map(b => String.fromCharCode(b))
        .join('');
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      console.log('[PosterGenerationService] 图片已保存到临时文件:', fileUri);

      // 验证文件是否成功保存
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists || !fileInfo.size || fileInfo.size === 0) {
        throw new Error('临时文件保存失败');
      }

      // 创建资源对象（这会自动保存到相册）
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      console.log('[PosterGenerationService] 海报已保存到相册，资源ID:', asset.id);
      
      // 清理临时文件
      try {
        await FileSystem.deleteAsync(fileUri);
        console.log('[PosterGenerationService] 临时文件已清理');
      } catch (cleanupError) {
        console.warn('[PosterGenerationService] 清理临时文件失败:', cleanupError);
      }
    } catch (error) {
      console.error('[PosterGenerationService] Android端保存失败:', error);
      
      if (error instanceof Error) {
        // 如果是网络相关错误，提供更友好的提示
        if (error.message.includes('404') || error.message.includes('下载失败')) {
          throw new Error('图片无法下载，请检查网络连接或稍后重试');
        }
        
        if (error.message.includes('超时')) {
          throw new Error('图片下载超时，请检查网络连接后重试');
        }
        
        throw error;
      } else {
        throw new Error('Android端保存海报失败');
      }
    }
  }
}

export const posterGenerationService = new PosterGenerationService();
