export interface UserGeneration {
  uid: string;
  prompt: string;
  ref_img?: string;
  g_imgurl1?: string;
  g_imgurl2?: string;
  g_imgurl3?: string;
  g_imgurl4?: string;
  download_img?: string;
}

export interface CreateGenerationRequest {
  uid: string;
  prompt: string;
  ref_img?: string;
}

export interface CreateGenerationWithResultRequest extends CreateGenerationRequest {
  g_imgurl1?: string;
  g_imgurl2?: string;
  g_imgurl3?: string;
  g_imgurl4?: string;
  download_img?: string;
}

export interface UpdateGenerationRequest {
  g_imgurl1?: string;
  g_imgurl2?: string;
  g_imgurl3?: string;
  g_imgurl4?: string;
  download_img?: string;
}

export interface UserGenerationResponse {
  success: boolean;
  message: string;
  data?: UserGeneration;
}

export interface GetUserGenerationsResponse {
  success: boolean;
  message: string;
  data?: UserGeneration[];
}