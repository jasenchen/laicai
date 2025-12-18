// 文件上传服务 - 基于AIPA官方文件上传API
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface UploadFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uri?: string;
}

export interface UploadOptions {
  onSuccess?: (files: UploadFile[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (loaded: number, total: number) => void;
  maxSize?: number; // 最大文件大小（字节）
  allowedTypes?: string[]; // 允许的文件类型
  maxFiles?: number; // 最大文件数量
}

export interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
}

// 获取文件类型
const getFileType = (uri: string, fileName?: string): string => {
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension) {
      const mimeTypes: { [key: string]: string } = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        txt: 'text/plain',
      };
      return mimeTypes[extension] || 'application/octet-stream';
    }
  }
  
  return 'application/octet-stream';
};

// 上传单个文件
export async function uploadSingleFile(file: File | { uri: string; name?: string; type?: string }): Promise<string> {
  console.log('[UploadService] 开始上传文件:', {
    name: file instanceof File ? file.name : file.name || '未知文件',
    size: file instanceof File ? file.size : '未知大小',
    type: file instanceof File ? file.type : file.type || '未知类型'
  });

  try {
    let formData: FormData;
    
    if (Platform.OS === 'web' && file instanceof File) {
      formData = new FormData();
      formData.append('file', file);
    } else {
      const fileObj = file as { uri: string; name?: string; type?: string };
      const fileName = fileObj.name || fileObj.uri.split('/').pop() || 'file';
      const fileType = fileObj.type || getFileType(fileObj.uri, fileName);
      
      formData = new FormData();
      // @ts-ignore - React Native FormData accepts object with uri, name, type
      formData.append('file', {
        uri: fileObj.uri,
        name: fileName,
        type: fileType,
      } as any);
    }

    const response = await fetch('https://aipa.bytedance.net/api/file-upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`文件上传失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('文件上传失败: 未返回文件URL');
    }

    console.log('[UploadService] 文件上传成功:', data.url);
    return data.url;
  } catch (error) {
    console.error('[UploadService] 文件上传失败:', error);
    throw error instanceof Error ? error : new Error('文件上传失败');
  }
}

// 选择并上传文件
export async function selectAndUploadFiles(options?: UploadOptions): Promise<UploadFile[]> {
  const {
    onSuccess,
    onError,
    onProgress,
    maxSize = 10 * 1024 * 1024,
    allowedTypes = ['image/*'],
    maxFiles = 1,
  } = options || {};

  try {
    console.log('[UploadService] 开始选择文件:', {
      allowedTypes,
      maxFiles,
      maxSize: `${(maxSize / 1024 / 1024).toFixed(2)}MB`
    });

    let result;
    if (Platform.OS === 'web') {
      result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes,
        multiple: maxFiles > 1,
        copyToCacheDirectory: false,
      });
    } else {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error('需要访问相册权限才能选择文件');
      }

      if (maxFiles === 1) {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
        
        if (result.assets && !result.canceled) {
          result = {
            canceled: false,
            assets: result.assets.map(asset => ({
              uri: asset.uri,
              name: asset.fileName || `photo_${Date.now()}.jpg`,
              size: asset.fileSize || 0,
              mimeType: asset.mimeType || 'image/jpeg',
            }))
          };
        }
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.8,
        });
        
        if (result.assets && !result.canceled) {
          result = {
            canceled: false,
            assets: result.assets.map(asset => ({
              uri: asset.uri,
              name: asset.fileName || `photo_${Date.now()}.jpg`,
              size: asset.fileSize || 0,
              mimeType: asset.mimeType || 'image/jpeg',
            }))
          };
        }
      }
    }

    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('[UploadService] 用户取消了文件选择');
      // 用户取消选择时不需要抛出错误，直接返回空数组
      return [];
    }

    const selectedFiles = Array.isArray(result.assets) ? result.assets : [result.assets];
    const filesToUpload = selectedFiles.slice(0, maxFiles);

    console.log(`[UploadService] 选择了 ${filesToUpload.length} 个文件`);

    const validFiles = [];
    for (const file of filesToUpload) {
      const fileSize = file.size || 0;
      if (fileSize > maxSize) {
        console.warn(`[UploadService] 文件过大: ${file.name}, 大小: ${fileSize}`);
        continue;
      }

      const fileType = file.mimeType || getFileType(file.uri, file.name);
      const isAllowedType = allowedTypes.some(allowedType => {
        if (allowedType.endsWith('/*')) {
          return fileType.startsWith(allowedType.slice(0, -1));
        }
        return fileType === allowedType;
      });

      if (!isAllowedType) {
        console.warn(`[UploadService] 文件类型不支持: ${file.name}, 类型: ${fileType}`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      throw new Error('没有符合条件的文件');
    }

    console.log(`[UploadService] 开始上传 ${validFiles.length} 个有效文件`);

    const uploadedFiles: UploadFile[] = [];
    const totalFiles = validFiles.length;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        onProgress?.(i, totalFiles);
        
        let url: string;
        
        if (Platform.OS === 'web') {
          const webFile = file as File;
          url = await uploadSingleFile(webFile);
          
          uploadedFiles.push({
            name: webFile.name,
            url,
            size: webFile.size,
            type: webFile.type,
          });
        } else {
          const rnFile = file as { uri: string; name?: string; size?: number; mimeType?: string };
          
          const fileInfo = await FileSystem.getInfoAsync(rnFile.uri);
          const fileName = rnFile.name || `file_${Date.now()}.${rnFile.mimeType?.split('/')?.pop() || 'bin'}`;
          
          url = await uploadSingleFile({
            uri: rnFile.uri,
            name: fileName,
            type: rnFile.mimeType || 'application/octet-stream',
          });
          
          uploadedFiles.push({
            name: fileName,
            url,
            size: rnFile.size || (fileInfo.exists ? fileInfo.size || 0 : 0),
            type: rnFile.mimeType || 'application/octet-stream',
            uri: rnFile.uri,
          });
        }
        
        console.log(`[UploadService] 文件上传完成 (${i + 1}/${totalFiles}):`, file.name);
      } catch (error) {
        console.error(`[UploadService] 文件上传失败:`, file.name, error);
        throw new Error(`文件 "${file.name}" 上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    onProgress?.(totalFiles, totalFiles);
    console.log(`[UploadService] 所有文件上传完成，共 ${uploadedFiles.length} 个`);
    
    onSuccess?.(uploadedFiles);
    return uploadedFiles;
    
  } catch (error) {
    console.error('[UploadService] 文件选择和上传失败:', error);
    const uploadError = error instanceof Error ? error : new Error('文件上传失败');
    onError?.(uploadError);
    throw uploadError;
  }
}

export async function uploadFromUri(
  uri: string, 
  fileName?: string, 
  fileType?: string,
  options?: UploadOptions
): Promise<UploadFile> {
  const { onSuccess, onError, onProgress } = options || {};

  try {
    console.log('[UploadService] 开始从URI上传文件:', uri);

    onProgress?.(0, 1);

    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('文件不存在');
    }

    const name = fileName || uri.split('/').pop() || `file_${Date.now()}`;
    const type = fileType || getFileType(uri, name);

    const url = await uploadSingleFile({
      uri,
      name,
      type,
    });

    const uploadFile: UploadFile = {
      name,
      url,
      size: fileInfo.size || 0,
      type,
      uri,
    };

    onProgress?.(1, 1);
    console.log('[UploadService] URI文件上传完成:', name);

    onSuccess?.([uploadFile]);
    return uploadFile;
    
  } catch (error) {
    console.error('[UploadService] URI文件上传失败:', error);
    const uploadError = error instanceof Error ? error : new Error('文件上传失败');
    onError?.(uploadError);
    throw uploadError;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}