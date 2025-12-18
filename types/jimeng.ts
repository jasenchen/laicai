// 即梦AI图片生成4.0类型定义
export interface JimengImageRequest {
  prompt: string;
  image_url?: string; // 图生图时的参考图URL
  style?: string; // 风格参数
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  strength?: number; // 图生图时的强度 (0-1)
}

export interface JimengImageResponse {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  image_url?: string;
  error?: string;
  created_at: number;
  finished_at?: number;
}

export interface JimengGenerationHistory {
  id: string;
  prompt: string;
  reference_image?: string;
  result_image: string;
  style: string;
  size: string;
  created_at: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface JimengStyleOption {
  id: string;
  name: string;
  description: string;
  preview?: string;
}

export interface JimengSizeOption {
  id: string;
  name: string;
  width: number;
  height: number;
}