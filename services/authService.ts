import { LoginRequest, AuthResponse, UserPhone } from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_DOMAIN = process.env.EXPO_PUBLIC_AIPA_API_DOMAIN || process.env.AIPA_API_DOMAIN || '';

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // 初始化用户手机号
  async initUserPhones(): Promise<{ success: boolean; message: string; data?: UserPhone[] }> {
    try {
      console.log('[AuthService] 初始化用户手机号');
      const response = await fetch(`${API_DOMAIN}/api/auth/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[AuthService] 初始化用户手机号结果:', result);
      return result;
    } catch (error) {
      console.error('[AuthService] 初始化用户手机号失败:', error);
      throw error;
    }
  }

  // 验证手机号
  async verifyPhone(phone: string): Promise<AuthResponse> {
    try {
      console.log('[AuthService] 验证手机号:', phone);
      
      const response = await fetch(`${API_DOMAIN}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.trim(),
        } as LoginRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '验证失败');
      }

      const result = await response.json();
      console.log('[AuthService] 验证手机号结果:', result);
      return result;
    } catch (error) {
      console.error('[AuthService] 验证手机号失败:', error);
      throw error;
    }
  }

  // 获取所有手机号（调试用）
  async getAllUserPhones(): Promise<{ success: boolean; message: string; data?: UserPhone[] }> {
    try {
      console.log('[AuthService] 获取手机号列表');
      const response = await fetch(`${API_DOMAIN}/api/auth/codes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[AuthService] 获取手机号列表结果:', result);
      return result;
    } catch (error) {
      console.error('[AuthService] 获取手机号列表失败:', error);
      throw error;
    }
  }

  // 更新用户行业信息
  async updatePhoneIndustry(uid: string, industry: { primary: string; secondary: string }): Promise<{ success: boolean; message: string; data?: UserPhone }> {
    try {
      console.log('[AuthService] 更新用户行业信息:', { uid, industry });
      
      const response = await fetch(`${API_DOMAIN}/api/auth/update-industry`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          industry,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新行业信息失败');
      }

      const result = await response.json();
      console.log('[AuthService] 更新用户行业信息结果:', result);
      return result;
    } catch (error) {
      console.error('[AuthService] 更新用户行业信息失败:', error);
      throw error;
    }
  }

  // 退出登录
  async logout(): Promise<void> {
    try {
      console.log('[AuthService] 退出登录');
      
      // 清除登录状态
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userUid');
      
      console.log('[AuthService] 退出登录成功');
      
      // 跳转到登录页
      router.replace('/login');
    } catch (error) {
      console.error('[AuthService] 退出登录失败:', error);
      throw error;
    }
  }

  // 检查用户生图次数
  async checkUserDosage(uid: string): Promise<{ success: boolean; message: string; data?: { dosage: number; canGenerate: boolean } }> {
    try {
      console.log('[AuthService] 检查用户生图次数:', uid);
      
      const response = await fetch(`${API_DOMAIN}/api/auth/check-dosage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '检查生图次数失败');
      }

      const result = await response.json();
      console.log('[AuthService] 检查用户生图次数结果:', result);
      return result;
    } catch (error) {
      console.error('[AuthService] 检查用户生图次数失败:', error);
      throw error;
    }
  }

  // 消耗用户生图次数
  async consumeUserDosage(uid: string): Promise<{ success: boolean; message: string; data?: { dosage: number; canGenerate: boolean } }> {
    try {
      console.log('[AuthService] 消耗用户生图次数:', uid);
      
      const response = await fetch(`${API_DOMAIN}/api/auth/consume-dosage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '消耗生图次数失败');
      }

      const result = await response.json();
      console.log('[AuthService] 消耗用户生图次数结果:', result);
      return result;
    } catch (error) {
      console.error('[AuthService] 消耗用户生图次数失败:', error);
      throw error;
    }
  }

  // 重置用户生图次数
  async resetUserDosage(uid: string): Promise<{ success: boolean; message: string; data?: { dosage: number; resettime: string } }> {
    try {
      console.log('[AuthService] 重置用户生图次数:', uid);
      
      const response = await fetch(`${API_DOMAIN}/api/auth/reset-dosage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '重置生图次数失败');
      }

      const result = await response.json();
      console.log('[AuthService] 重置用户生图次数结果:', result);
      return result;
    } catch (error) {
      console.error('[AuthService] 重置用户生图次数失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const authService = AuthService.getInstance();
