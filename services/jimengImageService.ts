import { JimengImageRequest, JimengImageResponse, JimengGenerationHistory } from '@/types/jimeng';

class JimengImageService {
  private baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
  private apiKey: string | null = null;
  private readonly API_KEY_STORAGE_KEY = 'jimeng_api_key';

  constructor() {
    // 异步加载API密钥，但不等待构造函数完成
    this.loadApiKey().catch(error => {
      console.error('[JimengImageService] 构造函数中加载API密钥失败:', error);
    });
    
    // 检查运行环境
    if (typeof window !== 'undefined') {
      console.log('[JimengImageService] 运行在Web环境');
    } else {
      console.log('[JimengImageService] 运行在原生环境');
    }
  }

  /**
   * 从本地存储加载API密钥
   */
  private async loadApiKey(): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedKey = await AsyncStorage.getItem(this.API_KEY_STORAGE_KEY);
      this.apiKey = storedKey || process.env.EXPO_PUBLIC_JIMENG_API_KEY || '';
      console.log('[JimengImageService] API密钥加载完成');
    } catch (error) {
      console.error('[JimengImageService] 加载API密钥失败:', error);
      this.apiKey = process.env.EXPO_PUBLIC_JIMENG_API_KEY || '';
    }
  }

  /**
   * 设置API密钥
   */
  async setApiKey(key: string): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      this.apiKey = key;
      if (key.trim()) {
        await AsyncStorage.setItem(this.API_KEY_STORAGE_KEY, key.trim());
        console.log('[JimengImageService] API密钥已保存');
      } else {
        await AsyncStorage.removeItem(this.API_KEY_STORAGE_KEY);
        console.log('[JimengImageService] API密钥已清除');
      }
    } catch (error) {
      console.error('[JimengImageService] 保存API密钥失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前API密钥
   */
  getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * 即梦AI图片生成4.0 - 文生图
   */
  async generateImage(request: JimengImageRequest): Promise<JimengImageResponse> {
    // 确保API密钥已加载
    if (!this.apiKey) {
      await this.loadApiKey();
    }

    if (!this.apiKey || !this.apiKey.trim()) {
      throw new Error('API密钥未设置，请先配置API Key');
    }

    try {
      console.log('[JimengImageService] 开始生成图片:', {
        prompt: request.prompt,
        style: request.style,
        width: request.width,
        height: request.height,
        apiKey: this.apiKey ? '已设置' : '未设置',
      });

      // 构建请求参数
      const requestBody = JSON.stringify({
        model: 'jimeng-v4-0',
        prompt: request.prompt,
        n: 1,
        size: request.width && request.height ? `${request.width}x${request.height}` : '1024x1024',
        style: request.style || 'vivid',
        quality: 'standard',
        response_format: 'url',
      });

      console.log('[JimengImageService] 请求详情:', {
        url: `${this.baseUrl}/images/generations`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey.trim().substring(0, 20)}...`,
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      let response;
      try {
        response = await fetch(`${this.baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey.trim()}`,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Expo/1.0)',
          },
          body: requestBody,
          // 添加网络请求配置
          signal: AbortSignal.timeout(45000), // 增加到45秒超时
        });
      } catch (fetchError) {
        console.error('[JimengImageService] 网络请求错误:', fetchError);
        
        // Web端特殊处理
        if (typeof window !== 'undefined') {
          console.log('[JimengImageService] Web端环境，尝试备用请求');
          // 尝试使用fetch的polyfill或其他方式
          throw new Error('Web端网络请求失败，可能是CORS问题或网络连接异常，请检查网络或联系管理员');
        }
        
        throw new Error('网络连接失败，请检查网络设置或稍后再试');
      }

      console.log('[JimengImageService] 响应状态:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '无法读取错误信息');
        console.error('[JimengImageService] API请求失败:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: `${this.baseUrl}/images/generations`,
        });
        
        // 提供更详细的错误信息
        let errorMessage = `即梦AI请求失败: ${response.status} ${response.statusText}`;
        if (response.status === 401) {
          errorMessage = 'API Key无效或已过期，请检查API Key配置';
        } else if (response.status === 403) {
          errorMessage = 'API访问被拒绝，请检查API Key权限';
        } else if (response.status === 429) {
          errorMessage = '请求过于频繁，请稍后再试';
        } else if (response.status === 404) {
          errorMessage = 'API接口不存在，请检查服务配置';
        } else if (response.status >= 500) {
          errorMessage = '即梦AI服务暂时不可用，请稍后再试';
        } else if (response.status === 0) {
          errorMessage = '网络连接失败，请检查网络设置或防火墙配置';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json().catch(error => {
        console.error('[JimengImageService] 解析响应JSON失败:', error);
        throw new Error('服务器响应格式错误，请稍后再试');
      });
      
      console.log('[JimengImageService] 生成成功:', data);

      // 验证响应数据格式
      if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error('服务器响应数据格式错误，未获取到生成结果');
      }

      const imageUrl = data.data[0]?.url;
      if (!imageUrl) {
        throw new Error('生成结果中缺少图片URL');
      }

      return {
        id: data.id || Date.now().toString(),
        status: 'success',
        image_url: imageUrl,
        created_at: Date.now(),
        finished_at: Date.now(),
      };
    } catch (error) {
      console.error('[JimengImageService] 生成图片失败:', error);
      
      // 提供更友好的错误提示
      let errorMessage = '图片生成失败，请重试';
      if (error instanceof Error) {
        if (error.message.includes('API Key') || error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'API Key配置有误，请检查并重新配置API Key';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network') || error.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络连接或稍后再试';
        } else if (error.message.includes('timeout')) {
          errorMessage = '请求超时，请稍后再试';
        } else if (error.message.includes('429')) {
          errorMessage = '请求过于频繁，请稍后再试';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Web端访问受限，请在移动端使用或联系管理员';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * 即梦AI图片生成4.0 - 图生图
   */
  async generateImageFromImage(request: JimengImageRequest): Promise<JimengImageResponse> {
    // 确保API密钥已加载
    if (!this.apiKey) {
      await this.loadApiKey();
    }

    if (!this.apiKey || !this.apiKey.trim()) {
      throw new Error('API密钥未设置，请先配置API Key');
    }

    if (!request.image_url) {
      throw new Error('图生图需要提供参考图片URL');
    }

    try {
      console.log('[JimengImageService] 开始图生图:', {
        prompt: request.prompt,
        image_url: request.image_url,
        strength: request.strength,
      });

      // 即梦AI的图生图接口（具体API路径需要根据官方文档调整）
      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey.trim()}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: 'jimeng-v4-0',
          image: request.image_url,
          prompt: request.prompt,
          n: 1,
          size: request.width && request.height ? `${request.width}x${request.height}` : '1024x1024',
          strength: request.strength || 0.8,
        }),
        // 添加网络请求配置
        signal: AbortSignal.timeout(30000), // 30秒超时
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[JimengImageService] 图生图请求失败:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: `${this.baseUrl}/images/edits`,
        });
        
        // 提供更详细的错误信息
        let errorMessage = `即梦AI图生图请求失败: ${response.status} ${response.statusText}`;
        if (response.status === 401) {
          errorMessage = 'API Key无效或已过期，请检查API Key配置';
        } else if (response.status === 429) {
          errorMessage = '请求过于频繁，请稍后再试';
        } else if (response.status >= 500) {
          errorMessage = '即梦AI服务暂时不可用，请稍后再试';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[JimengImageService] 图生图成功:', data);

      return {
        id: data.id || Date.now().toString(),
        status: 'success',
        image_url: data.data?.[0]?.url,
        created_at: Date.now(),
        finished_at: Date.now(),
      };
    } catch (error) {
      console.error('[JimengImageService] 图生图失败:', error);
      
      // 提供更友好的错误提示
      let errorMessage = '图生图失败，请重试';
      if (error instanceof Error) {
        if (error.message.includes('API Key') || error.message.includes('401')) {
          errorMessage = 'API Key配置有误，请检查并重新配置API Key';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          errorMessage = '网络连接失败，请检查网络连接或稍后再试';
        } else if (error.message.includes('timeout')) {
          errorMessage = '请求超时，请稍后再试';
        } else if (error.message.includes('429')) {
          errorMessage = '请求过于频繁，请稍后再试';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * 获取生成历史记录（从本地存储）
   */
  async getGenerationHistory(): Promise<JimengGenerationHistory[]> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const historyData = await AsyncStorage.getItem('jimeng_history');
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('[JimengImageService] 获取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 保存生成历史记录到本地存储
   */
  async saveToHistory(item: JimengGenerationHistory): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const history = await this.getGenerationHistory();
      history.unshift(item); // 添加到开头
      // 只保留最近50条记录
      const limitedHistory = history.slice(0, 50);
      await AsyncStorage.setItem('jimeng_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('[JimengImageService] 保存历史记录失败:', error);
    }
  }

  /**
   * 清除历史记录
   */
  async clearHistory(): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem('jimeng_history');
    } catch (error) {
      console.error('[JimengImageService] 清除历史记录失败:', error);
    }
  }
}

// 导出单例实例
export const jimengImageService = new JimengImageService();