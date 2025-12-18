import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { selectAndUploadFiles, uploadFromUri, uploadSingleFile, UploadFile, UploadOptions } from '@/services/uploadService';

export interface UseFileUploadOptions extends Omit<UploadOptions, 'onSuccess' | 'onError'> {
  onSuccess?: (files: UploadFile[]) => void;
  onError?: (error: Error) => void;
}

export interface UseFileUploadReturn {
  selectFiles: () => Promise<void>;
  takePhoto: () => Promise<void>;
  uploadFromUri: (uri: string, fileName?: string, fileType?: string) => Promise<UploadFile>;
  clearFiles: () => void;
  files: UploadFile[];
  status: 'idle' | 'uploading' | 'success' | 'error';
  error: Error | null;
  progress: number;
  isLoading: boolean;
}

export function useFileUpload(options?: UseFileUploadOptions): UseFileUploadReturn {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const {
    maxSize = 10 * 1024 * 1024,
    allowedTypes = ['image/*'],
    maxFiles = 1,
    onSuccess,
    onError,
    onProgress,
  } = options || {};

  const handleProgress = useCallback((loaded: number, total: number) => {
    const progressPercent = total > 0 ? (loaded / total) * 100 : 0;
    setProgress(progressPercent);
    onProgress?.(loaded, total);
  }, [onProgress]);

  const handleSuccess = useCallback((uploadedFiles: UploadFile[]) => {
    setFiles(uploadedFiles);
    setStatus('success');
    setError(null);
    setProgress(100);
    onSuccess?.(uploadedFiles);
    console.log('[useFileUpload] 文件上传成功:', uploadedFiles.length, '个文件');
  }, [onSuccess]);

  const handleError = useCallback((uploadError: Error) => {
    setStatus('error');
    setError(uploadError);
    setProgress(0);
    onError?.(uploadError);
    console.error('[useFileUpload] 文件上传失败:', uploadError);
  }, [onError]);

  const selectFiles = useCallback(async () => {
    if (status === 'uploading') {
      console.warn('[useFileUpload] 正在上传中，忽略重复请求');
      return;
    }

    try {
      setStatus('uploading');
      setError(null);
      setProgress(0);

      const uploadOptions: UploadOptions = {
        maxSize,
        allowedTypes,
        maxFiles,
        onSuccess: handleSuccess,
        onError: handleError,
        onProgress: handleProgress,
      };

      const uploadedFiles = await selectAndUploadFiles(uploadOptions);
      
      // 如果用户取消选择，返回空数组，重置状态
      if (uploadedFiles.length === 0) {
        setStatus('idle');
        console.log('[useFileUpload] 用户取消选择文件，状态已重置');
        return;
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('文件上传失败'));
    }
  }, [status, maxSize, allowedTypes, maxFiles, handleSuccess, handleError, handleProgress]);

  const takePhoto = useCallback(async () => {
    if (status === 'uploading') {
      console.warn('[useFileUpload] 正在上传中，忽略重复请求');
      return;
    }

    try {
      setStatus('uploading');
      setError(null);
      setProgress(0);

      console.log('[useFileUpload] 请求相机权限...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        console.error('[useFileUpload] 相机权限被拒绝:', permissionResult);
        throw new Error('需要相机权限才能拍照。请在设置中允许应用访问相机。');
      }

      console.log('[useFileUpload] 相机权限已获取，启动相机...');
      
      // iOS 特定配置，防止闪退
      const cameraOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS === 'ios' ? false : true, // iOS 上禁用编辑避免闪退
        quality: 0.8,
        // presentationStyle: Platform.OS === 'ios' ? 'pageSheet' : undefined, // iOS 使用页面样式
      };

      const result = await ImagePicker.launchCameraAsync(cameraOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setStatus('idle');
        console.log('[useFileUpload] 用户取消了拍照');
        return;
      }

      const asset = result.assets[0];
      console.log('[useFileUpload] 拍照完成，开始上传:', {
        fileName: asset.fileName,
        uri: asset.uri,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType
      });

      // 验证文件大小
      if (asset.fileSize && asset.fileSize > maxSize) {
        throw new Error(`图片文件过大，最大支持 ${Math.round(maxSize / 1024 / 1024)}MB`);
      }

      const uploadOptions: UploadOptions = {
        maxSize,
        allowedTypes,
        maxFiles: 1,
        onSuccess: handleSuccess,
        onError: handleError,
        onProgress: handleProgress,
      };

      await uploadFromUri(
        asset.uri,
        asset.fileName || `photo_${Date.now()}.jpg`,
        asset.mimeType,
        uploadOptions
      );
    } catch (error) {
      console.error('[useFileUpload] 拍照失败:', error);
      
      // 特殊处理iOS相机相关错误
      if (Platform.OS === 'ios') {
        const errorMessage = error instanceof Error ? error.message : '拍照失败';
        
        if (errorMessage.includes('permission') || errorMessage.includes('权限')) {
          handleError(new Error('请前往 设置 > 隐私与安全性 > 相机，允许此应用访问相机'));
        } else if (errorMessage.includes('cancelled') || errorMessage.includes('取消')) {
          setStatus('idle'); // 用户取消，不视为错误
        } else {
          handleError(new Error(`相机功能暂时不可用：${errorMessage}`));
        }
      } else {
        handleError(error instanceof Error ? error : new Error('拍照上传失败'));
      }
    }
  }, [status, maxSize, allowedTypes, handleSuccess, handleError, handleProgress]);

  const uploadFromUriHandler = useCallback(async (
    uri: string, 
    fileName?: string, 
    fileType?: string
  ): Promise<UploadFile> => {
    if (status === 'uploading') {
      throw new Error('正在上传中，请稍后再试');
    }

    try {
      setStatus('uploading');
      setError(null);
      setProgress(0);

      const uploadOptions: UploadOptions = {
        maxSize,
        allowedTypes,
        maxFiles: 1,
        onSuccess: handleSuccess,
        onError: handleError,
        onProgress: handleProgress,
      };

      const uploadedFile = await uploadFromUri(uri, fileName, fileType, uploadOptions);
      return uploadedFile;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('文件上传失败'));
      throw error;
    }
  }, [status, maxSize, allowedTypes, handleSuccess, handleError, handleProgress]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setStatus('idle');
    setError(null);
    setProgress(0);
    console.log('[useFileUpload] 已清空文件列表');
  }, []);

  return {
    selectFiles,
    takePhoto,
    uploadFromUri: uploadFromUriHandler,
    clearFiles,
    files,
    status,
    error,
    progress,
    isLoading: status === 'uploading',
  };
}

// 为即梦AI提供的简化hook
export function useImageUpload(): {
  pickImage: () => Promise<string | null>;
  uploadImage: (uri: string) => Promise<string>;
} {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error('需要相册权限才能选择图片');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return asset.uri;
    } catch (error) {
      console.error('[useImageUpload] 选择图片失败:', error);
      throw error;
    }
  }, []);

  const uploadImage = useCallback(async (uri: string): Promise<string> => {
    try {
      const uploadOptions: UploadOptions = {
        onSuccess: (uploadedFiles) => {
          setFiles(uploadedFiles);
        },
        onError: (error) => {
          throw error;
        },
      };

      const uploadedFile = await uploadFromUri(uri, undefined, undefined, uploadOptions);
      return uploadedFile.url;
    } catch (error) {
      console.error('[useImageUpload] 上传图片失败:', error);
      throw error;
    }
  }, []);

  return {
    pickImage,
    uploadImage,
  };
}