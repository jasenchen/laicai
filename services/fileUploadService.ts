/**
 * AIPA 官方文件上传服务
 * 基于参考实现重新设计的简化版本
 */

import { Platform } from 'react-native';
import { ImagePickerAsset } from '@/types/upload';
import * as FileSystem from 'expo-file-system';

export interface UploadOptions {
  file: ImagePickerAsset;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResponse {
  success: boolean;
  url?: string;
  message?: string;
}

class FileUploadService {
  private readonly uploadURL = 'https://aipa.bytedance.net/api/file-upload';

  /**
   * 文件上传服务
   * @param options 上传选项
   * @returns 返回CDN地址
   */
  async uploadFile(options: UploadOptions): Promise<string> {
    const { file, onProgress } = options;

    try {
      console.log('[FileUploadService] 开始上传文件:', {
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        type: file.type,
        platform: Platform.OS,
      });

      // 检查文件是否存在
      if (!file || !file.uri) {
        throw new Error('文件信息无效');
      }

      // 创建FormData
      const formData = new FormData();
      
      // 根据平台处理文件
      if (Platform.OS === 'web') {
        // Web端处理 - 直接从URI创建文件
        try {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const fileName = file.fileName || `upload_${Date.now()}.${file.type}`;
          formData.append('file', blob, fileName);
        } catch (blobError) {
          console.error('[FileUploadService] 创建Blob失败:', blobError);
          throw new Error('文件读取失败，请重试');
        }
      } else {
        // 移动端处理
        const fileInfo = {
          uri: file.uri,
          type: file.mimeType || 'image/jpeg',
          name: file.fileName || `upload_${Date.now()}.${file.type}`,
        };
        formData.append('file', fileInfo as any);
      }

      console.log('[FileUploadService] 准备发送上传请求');

      // 使用fetch API进行上传
      const response = await fetch(this.uploadURL, {
        method: 'POST',
        body: formData,
        // 不设置Content-Type，让浏览器自动处理multipart/form-data边界
      });

      console.log('[FileUploadService] 上传响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FileUploadService] 服务器返回错误:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        
        // 根据状态码返回具体错误
        if (response.status === 413) {
          throw new Error('文件过大，请选择较小的文件');
        } else if (response.status === 415) {
          throw new Error('不支持的文件格式');
        } else if (response.status >= 500) {
          throw new Error('服务器内部错误，请稍后重试');
        } else {
          throw new Error(`上传失败 (${response.status}): ${response.statusText || '未知错误'}`);
        }
      }

      // 解析响应
      let responseText;
      try {
        responseText = await response.text();
        console.log('[FileUploadService] 响应内容:', responseText);
        
        const data = JSON.parse(responseText);
        console.log('[FileUploadService] 解析后的响应:', data);
        
        if (!data.url) {
          throw new Error('服务器响应中没有返回文件URL');
        }
        
        // 检查是否为降级URL
        if (data.isFallback) {
          console.warn('[FileUploadService] 收到降级URL:', {
            url: data.url,
            warning: data.warning,
            originalError: data.originalError
          });
        }
        
        return data.url;
      } catch (parseError) {
        console.error('[FileUploadService] 解析响应失败:', parseError);
        console.error('[FileUploadService] 原始响应:', responseText);
        throw new Error('服务器响应格式错误，请联系技术支持');
      }

    } catch (error) {
      console.error('[FileUploadService] 上传过程中出错:', {
        error: error,
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // 重新抛出错误，保持错误信息
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('上传过程中发生未知错误');
      }
    }
  }

  /**
   * 上传Base64图片
   * @param base64Data Base64图片数据
   * @param fileName 文件名
   * @returns CDN地址
   */
  async uploadBase64Image(base64Data: string, fileName?: string): Promise<string> {
    try {
      console.log('[FileUploadService] 开始上传Base64图片:', {
        fileName,
        dataLength: base64Data.length,
        platform: Platform.OS,
      });

      // 检查Base64数据是否有效
      if (!base64Data || !base64Data.startsWith('data:image/')) {
        throw new Error('无效的Base64图片数据');
      }

      // 提取Base64的MIME类型和实际数据
      const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Base64数据格式错误');
      }

      const mimeType = matches[1];
      const base64Content = matches[2];
      const actualFileName = fileName || `upload_${Date.now()}.${mimeType.split('/')[1]}`;

      console.log('[FileUploadService] 解析Base64:', {
        mimeType,
        fileName: actualFileName,
        contentLength: base64Content.length
      });

      // 将Base64转换为Blob
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // 创建FormData
      const formData = new FormData();
      formData.append('file', blob, actualFileName);

      console.log('[FileUploadService] 准备发送Base64上传请求');

      // 使用fetch API进行上传
      const response = await fetch(this.uploadURL, {
        method: 'POST',
        body: formData,
      });

      console.log('[FileUploadService] Base64上传响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FileUploadService] 服务器返回错误:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        
        // 根据状态码返回具体错误
        if (response.status === 413) {
          throw new Error('文件过大，请选择较小的文件');
        } else if (response.status === 415) {
          throw new Error('不支持的文件格式');
        } else if (response.status >= 500) {
          throw new Error('服务器内部错误，请稍后重试');
        } else {
          throw new Error(`上传失败 (${response.status}): ${response.statusText || '未知错误'}`);
        }
      }

      // 解析响应
      let responseText;
      try {
        responseText = await response.text();
        console.log('[FileUploadService] Base64上传响应内容:', responseText);
        
        const data = JSON.parse(responseText);
        console.log('[FileUploadService] 解析后的Base64上传响应:', data);
        
        if (!data.url) {
          throw new Error('服务器响应中没有返回文件URL');
        }
        
        return data.url;
      } catch (parseError) {
        console.error('[FileUploadService] 解析Base64上传响应失败:', parseError);
        console.error('[FileUploadService] 原始响应:', responseText);
        throw new Error('服务器响应格式错误，请联系技术支持');
      }

    } catch (error) {
      console.error('[FileUploadService] Base64上传过程中出错:', {
        error: error,
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // 重新抛出错误，保持错误信息
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Base64上传过程中发生未知错误');
      }
    }
  }

  /**
   * 简化的文件上传函数（兼容性）
   * @param file 文件对象
   * @returns CDN地址
   */
  async uploadFileSimple(file: ImagePickerAsset): Promise<string> {
    return this.uploadFile({ file });
  }

  /**
   * 验证文件是否符合上传要求
   * @param file 文件对象
   * @param maxSize 最大文件大小（字节），默认10MB
   * @param allowedTypes 允许的文件类型
   * @returns 验证结果
   */
  validateFile(
    file: ImagePickerAsset,
    maxSize: number = 10 * 1024 * 1024, // 10MB
    allowedTypes: string[] = ['image/*', 'video/*']
  ): { valid: boolean; error?: string } {
    // 检查文件大小
    if (file.fileSize && file.fileSize > maxSize) {
      return {
        valid: false,
        error: `文件大小超过限制（最大${Math.round(maxSize / 1024 / 1024)}MB）`,
      };
    }

    // 检查文件类型
    if (file.mimeType) {
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.mimeType!.startsWith(type.slice(0, -2));
        }
        return file.mimeType === type;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: '不支持的文件类型',
        };
      }
    }

    return { valid: true };
  }

  /**
   * 通过图片URL上传文件
   * 先下载图片到本地缓存，再上传到 AIPA CDN
   * @param imageUrl 图片URL
   * @param fileName 文件名（可选）
   * @returns 上传后的 CDN 地址
   */
  async uploadImageFromUrl(imageUrl: string, fileName?: string): Promise<string> {
    try {
      console.log('[FileUploadService] 开始通过URL上传图片:', { imageUrl });

      // 验证图片URL是否有效
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('图片URL无效');
      }
      
      // 检查URL是否为有效的HTTP/HTTPS地址
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        throw new Error('图片URL格式无效');
      }

      // 检查图片URL是否已经是CDN地址（避免重复上传）
      if (imageUrl.includes('cdn-tos-cn.bytedance.net') || 
          imageUrl.includes('aipa.bytedance.net')) {
        console.log('[FileUploadService] 图片已经是AIPA CDN地址，跳过上传:', imageUrl);
        return imageUrl;
      }

      console.log('[FileUploadService] 直接下载图片后上传:', imageUrl);

      // 直接下载和上传
      return await this.downloadAndUpload(imageUrl, fileName);
      
    } catch (error) {
      console.error('[FileUploadService] 通过URL上传图片失败:', error);
      
      // 网络错误时直接返回原始URL作为降级方案
      if (error instanceof Error && (
        error.message.includes('403') || 
        error.message.includes('404') || 
        error.message.includes('超时') ||
        error.message.includes('网络') ||
        error.message.includes('下载失败') ||
        error.message.includes('Failed to fetch')
      )) {
        console.warn('[FileUploadService] 网络错误，返回原始URL:', {
          imageUrl,
          error: error.message
        });
        return imageUrl;
      }
      
      throw error instanceof Error ? error : new Error('通过URL上传图片失败');
    }
  }



  /**
   * 下载图片并上传到AIPA CDN
   * 统一的下载和上传方法，支持Web和移动端
   * @param imageUrl 图片URL
   * @param fileName 文件名（可选）
   * @returns 上传后的 CDN 地址
   */
  private async downloadAndUpload(imageUrl: string, fileName?: string): Promise<string> {
    console.log('[FileUploadService] 开始下载图片:', imageUrl);
    
    if (Platform.OS === 'web') {
      return await this.downloadAndUploadWeb(imageUrl, fileName);
    } else {
      return await this.downloadAndUploadMobile(imageUrl, fileName);
    }
  }

  /**
   * Web端下载图片并上传
   * @param imageUrl 图片URL
   * @param fileName 文件名（可选）
   * @returns 上传后的 CDN 地址
   */
  private async downloadAndUploadWeb(imageUrl: string, fileName?: string): Promise<string> {
    const downloadController = new AbortController();
    const downloadTimeoutId = setTimeout(() => downloadController.abort(), 30000); // 30秒下载超时

    try {
      // 下载图片到内存
      const response = await fetch(imageUrl, {
        signal: downloadController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          'Referer': 'https://www.bytedance.com/',
          'Accept': 'image/*,*/*;q=0.8',
          'Origin': 'https://www.bytedance.com',
        },
      });
      
      // 清除下载超时定时器
      clearTimeout(downloadTimeoutId);
      
      if (!response.ok) {
        throw new Error(`图片下载失败: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // 检查blob是否有效
      if (blob.size === 0) {
        throw new Error('下载的图片文件为空');
      }
      
      // 检查是否为有效的图片格式
      const contentType = blob.type.toLowerCase();
      if (!contentType.includes('image/')) {
        throw new Error(`下载的文件不是图片格式: ${contentType}`);
      }
      
      console.log('[FileUploadService] Web端图片下载成功:', {
        size: blob.size,
        type: contentType,
        originalUrl: imageUrl
      });
      
      const finalFileName = fileName || `web_${Date.now()}.${this.getImageExtensionFromBlob(blob)}`;
      
      // 创建Blob URL并上传
      const localFileUrl = URL.createObjectURL(blob);
      console.log('[FileUploadService] Web端创建本地Blob URL:', localFileUrl);
      
      try {
        const imageAsset: ImagePickerAsset = {
          uri: localFileUrl,
          fileName: finalFileName,
          fileSize: blob.size,
          mimeType: blob.type,
          type: this.getImageExtensionFromBlob(blob) as 'image' | 'video',
          width: 0,
          height: 0,
        };
        
        const uploadedUrl = await this.uploadFile({ file: imageAsset });
        
        console.log('[FileUploadService] Web端图片上传成功:', {
          originalUrl: imageUrl,
          uploadedUrl: uploadedUrl
        });
        
        return uploadedUrl;
      } finally {
        // 清理Blob URL
        if (localFileUrl.startsWith('blob:')) {
          URL.revokeObjectURL(localFileUrl);
        }
      }
      
    } catch (error) {
      // 清除下载超时定时器
      clearTimeout(downloadTimeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('图片下载超时，请检查网络连接后重试');
      }
      
      console.error('[FileUploadService] Web端下载或上传失败:', {
        imageUrl,
        error: error instanceof Error ? error.message : error
      });
      
      throw error instanceof Error ? error : new Error('Web端图片处理失败');
    }
  }

  /**
   * 移动端下载图片并上传
   * @param imageUrl 图片URL
   * @param fileName 文件名（可选）
   * @returns 上传后的 CDN 地址
   */
  private async downloadAndUploadMobile(imageUrl: string, fileName?: string): Promise<string> {
    console.log('[FileUploadService] 移动端开始下载图片到本地文件:', imageUrl);
    
    try {
      // 使用expo-file-system下载图片到本地文件
      const finalFileName = fileName || `mobile_${Date.now()}.png`;
      const localFileUri = `${FileSystem.cacheDirectory}${finalFileName}`;
      
      console.log('[FileUploadService] 移动端准备下载到:', localFileUri);
      
      // 下载图片到本地文件
      const downloadResult = await FileSystem.downloadAsync(imageUrl, localFileUri);
      
      console.log('[FileUploadService] 移动端下载结果:', {
        status: downloadResult.status,
        uri: downloadResult.uri,
        headers: downloadResult.headers
      });
      
      if (downloadResult.status !== 200) {
        throw new Error(`移动端下载失败，状态码: ${downloadResult.status}`);
      }
      
      // 验证文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error('移动端下载的文件无效或为空');
      }
      
      console.log('[FileUploadService] 移动端文件验证成功:', {
        uri: fileInfo.uri,
        size: fileInfo.size,
        exists: fileInfo.exists
      });
      
      // 创建ImagePickerAsset用于上传
      const imageAsset: ImagePickerAsset = {
        uri: downloadResult.uri, // 使用本地文件URI
        fileName: finalFileName,
        fileSize: fileInfo.size,
        mimeType: 'image/png', // 根据实际文件类型设置
        type: 'image',
        width: 0,
        height: 0,
      };
      
      console.log('[FileUploadService] 移动端开始上传本地文件:', {
        fileName: finalFileName,
        fileSize: fileInfo.size,
        localUri: downloadResult.uri
      });
      
      // 上传本地文件到AIPA
      const uploadedUrl = await this.uploadFile({ file: imageAsset });
      
      console.log('[FileUploadService] 移动端文件上传成功:', {
        originalUrl: imageUrl,
        localFile: downloadResult.uri,
        uploadedUrl: uploadedUrl
      });
      
      // 清理本地临时文件
      try {
        await FileSystem.deleteAsync(downloadResult.uri);
        console.log('[FileUploadService] 移动端临时文件已清理:', downloadResult.uri);
      } catch (cleanupError) {
        console.warn('[FileUploadService] 移动端清理临时文件失败:', cleanupError);
      }
      
      return uploadedUrl;
      
    } catch (error) {
      console.error('[FileUploadService] 移动端下载或上传失败:', {
        imageUrl,
        error: error instanceof Error ? error.message : error
      });
      
      throw error instanceof Error ? error : new Error('移动端图片处理失败');
    }
  }

  /**
   * 批量上传图片
   * @param imageUrls 图片URL数组
   * @returns 上传后的 CDN 地址数组
   */
  async uploadMultipleImages(imageUrls: string[]): Promise<string[]> {
    try {
      console.log('[FileUploadService] 开始批量上传图片:', { count: imageUrls.length });
      
      const uploadPromises = imageUrls.map(async (url, index) => {
        try {
          const fileName = `poster_${Date.now()}_${index}.png`;
          return await this.uploadImageFromUrl(url, fileName);
        } catch (error) {
          console.error(`[FileUploadService] 第${index + 1}张图片上传失败:`, error);
          // 对于失败的图片，返回原始URL作为降级方案
          return url;
        }
      });

      const results = await Promise.all(uploadPromises);
      console.log('[FileUploadService] 批量上传完成:', { 
        successCount: results.length,
        urls: results 
      });
      
      return results;
    } catch (error) {
      console.error('[FileUploadService] 批量上传失败:', error);
      
      // 如果整体出现错误，返回原始URL数组作为降级方案
      return imageUrls;
    }
  }

  /**
   * 从 Blob 获取图片扩展名
   * @param blob Blob 对象
   * @returns 文件扩展名
   */
  private getImageExtensionFromBlob(blob: Blob): string {
    const type = blob.type.toLowerCase();
    
    if (type.includes('png')) return 'png';
    if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
    if (type.includes('webp')) return 'webp';
    if (type.includes('gif')) return 'gif';
    
    // 默认返回 png
    return 'png';
  }
}

export const fileUploadService = new FileUploadService();