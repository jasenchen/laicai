import { 
  UserGeneration, 
  CreateGenerationRequest, 
  UpdateGenerationRequest,
  CreateGenerationWithResultRequest,
  UserGenerationResponse,
  GetUserGenerationsResponse 
} from '@/types/userGeneration';

class UserGenerationService {
  private readonly API_BASE = process.env.EXPO_PUBLIC_AIPA_API_DOMAIN || process.env.AIPA_API_DOMAIN || '';

  /**
   * 创建生成记录
   */
  async createGeneration(request: CreateGenerationRequest): Promise<UserGenerationResponse> {
    try {
      console.log('[UserGenerationService] 创建生成记录:', { uid: request.uid, prompt: request.prompt });
      
      const response = await fetch(`${this.API_BASE}/api/user-generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '创建生成记录失败');
      }

      console.log('[UserGenerationService] 生成记录创建成功:', result.data);
      return {
        success: true,
        message: '生成记录创建成功',
        data: result.data
      };
    } catch (error) {
      console.error('[UserGenerationService] 创建生成记录失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '创建生成记录失败'
      };
    }
  }

  /**
   * 创建包含生成结果的记录
   */
  async createGenerationWithResult(request: CreateGenerationWithResultRequest): Promise<UserGenerationResponse> {
    try {
      console.log('[UserGenerationService] 创建包含生成结果的记录:', { 
        uid: request.uid, 
        prompt: request.prompt.substring(0, 50) + '...',
        g_imgurl1: request.g_imgurl1?.substring(0, 50) + '...',
        g_imgurl2: request.g_imgurl2?.substring(0, 50) + '...',
        g_imgurl3: request.g_imgurl3?.substring(0, 50) + '...',
        g_imgurl4: request.g_imgurl4?.substring(0, 50) + '...'
      });
      
      const response = await fetch(`${this.API_BASE}/api/user-generations/with-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '创建生成记录失败');
      }

      console.log('[UserGenerationService] 包含生成结果的记录创建成功:', result.data);
      return {
        success: true,
        message: '生成记录创建成功',
        data: result.data
      };
    } catch (error) {
      console.error('[UserGenerationService] 创建包含生成结果的记录失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '创建生成记录失败'
      };
    }
  }

  /**
   * 获取用户的所有生成记录
   */
  async getUserGenerations(uid: string, limit?: number): Promise<GetUserGenerationsResponse> {
    try {
      console.log('[UserGenerationService] 获取用户生成记录:', { uid, limit });
      
      const url = limit 
        ? `${this.API_BASE}/api/user-generations?uid=${encodeURIComponent(uid)}&limit=${limit}`
        : `${this.API_BASE}/api/user-generations?uid=${encodeURIComponent(uid)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取生成记录失败');
      }

      console.log('[UserGenerationService] 获取生成记录成功:', { count: result.data?.length });
      return {
        success: true,
        message: '获取生成记录成功',
        data: result.data
      };
    } catch (error) {
      console.error('[UserGenerationService] 获取生成记录失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取生成记录失败'
      };
    }
  }

  /**
   * 更新生成记录中的下载信息
   */
  async updateDownloadRecord(uid: string, downloadImg: string): Promise<UserGenerationResponse> {
    try {
      console.log('[UserGenerationService] 更新下载记录:', { uid, downloadImg: downloadImg.substring(0, 50) + '...' });
      
      const response = await fetch(`${this.API_BASE}/api/user-generations/update-download`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, download_img: downloadImg }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '更新下载记录失败');
      }

      console.log('[UserGenerationService] 下载记录更新成功:', result.data);
      return {
        success: true,
        message: '下载记录更新成功',
        data: result.data
      };
    } catch (error) {
      console.error('[UserGenerationService] 更新下载记录失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新下载记录失败'
      };
    }
  }

  /**
   * 删除生成记录
   */
  async deleteGeneration(uid: string): Promise<UserGenerationResponse> {
    try {
      console.log('[UserGenerationService] 删除生成记录:', { uid });
      
      const response = await fetch(`${this.API_BASE}/api/user-generations/${uid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '删除生成记录失败');
      }

      console.log('[UserGenerationService] 生成记录删除成功');
      return {
        success: true,
        message: '生成记录删除成功'
      };
    } catch (error) {
      console.error('[UserGenerationService] 删除生成记录失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '删除生成记录失败'
      };
    }
  }
}

export const userGenerationService = new UserGenerationService();
