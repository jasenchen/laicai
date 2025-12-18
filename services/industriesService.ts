import { IndustryData, IndustryApiResponse } from '@/types/industries';

export class IndustriesService {
  private static readonly BASE_URL = process.env.EXPO_PUBLIC_AIPA_API_DOMAIN || process.env.AIPA_API_DOMAIN || '';

  /**
   * 获取所有行业分类数据
   */
  static async getIndustries(): Promise<IndustryData> {
    console.log('[IndustriesService] 获取行业数据');
    
    try {
      const response = await fetch(`${this.BASE_URL}/api/industries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`获取行业数据失败: ${response.status}`);
      }

      const result: IndustryApiResponse = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取行业数据失败');
      }

      console.log('[IndustriesService] 成功获取行业数据:', {
        primaryCount: result.data.primaryCategories.length,
        secondaryCount: Object.keys(result.data.secondaryCategories).length
      });

      return result.data;
    } catch (error) {
      console.error('[IndustriesService] 获取行业数据异常:', error);
      throw error;
    }
  }

  /**
   * 初始化行业数据
   */
  static async initializeIndustries(): Promise<void> {
    console.log('[IndustriesService] 初始化行业数据');
    
    try {
      const response = await fetch(`${this.BASE_URL}/api/industries/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`初始化行业数据失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '初始化行业数据失败');
      }

      console.log('[IndustriesService] 初始化行业数据成功:', result.message);
    } catch (error) {
      console.error('[IndustriesService] 初始化行业数据异常:', error);
      throw error;
    }
  }
}
