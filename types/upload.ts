// 文件上传相关类型定义
type ImagePickerAsset = {
  uri: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  type?: 'image' | 'video' | 'livePhoto' | 'pairedVideo';
  width?: number;
  height?: number;
};

export interface UploadOptions {
  file: ImagePickerAsset;
  onProgress?: (progress: number) => void;
}

export interface UploadFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uri?: string;
}

export interface FileUploadOptions {
  onSuccess?: (files: UploadFile[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (loaded: number, total: number) => void;
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface FileUploadProps {
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
  showProgress?: boolean;
  showPreview?: boolean;
  className?: string;
  onFilesChange?: (files: UploadFile[]) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (files: UploadFile[]) => void;
  onUploadError?: (error: Error) => void;
}

export interface FileUploadExampleProps {
  title?: string;
  description?: string;
}

export type { ImagePickerAsset };