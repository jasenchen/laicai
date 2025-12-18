// 火山引擎图生图相关类型定义
export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  supportedSizes: string[];
  maxImages: number;
}

export interface PromptTemplate {
  category: string;
  templates: string[];
}

export interface GenerationHistory {
  id: string;
  prompt: string;
  model: string;
  size: string;
  watermark: boolean;
  referenceImages: string[];
  generatedImages: string[];
  createdAt: Date;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface ImageGenerationSettings {
  model: string;
  size: string;
  watermark: boolean;
  maxImages: number;
  autoSave: boolean;
}