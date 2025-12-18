import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';

const DAILY_LIMIT_KEY = 'daily_generation_limit';
const LAST_RESET_DATE_KEY = 'last_reset_date';
const DAILY_LIMIT_COUNT = 10;

interface GenerationLimitData {
  remainingCount: number;
  lastResetDate: string;
}

export const useGenerationLimit = () => {
  const [remainingCount, setRemainingCount] = useState<number>(0); // 初始化为0，等待从数据库获取
  const [isLoading, setIsLoading] = useState(true);

  // 获取用户ID
  const getUserId = useCallback(async (): Promise<string> => {
    try {
      let uid = await AsyncStorage.getItem('userUid') || '';
      if (!uid) {
        // 兼容旧版本数据格式
        const authData = await AsyncStorage.getItem('authData');
        if (authData) {
          const parsed = JSON.parse(authData);
          uid = parsed.uid || '';
        }
      }
      return uid;
    } catch (error) {
      console.error('[GenerationLimit] 获取用户ID失败:', error);
      return '';
    }
  }, []);

  // 从数据库检查并获取生图次数
  const checkAndLoadCount = useCallback(async () => {
    try {
      const uid = await getUserId();
      if (!uid) {
        console.warn('[GenerationLimit] 未找到用户ID，设置默认次数10');
        setRemainingCount(10);
        setIsLoading(false);
        return;
      }

      console.log('[GenerationLimit] 检查用户生图次数:', uid);
      const result = await authService.checkUserDosage(uid);
      
      if (result.success && result.data) {
        console.log('[GenerationLimit] 获取生图次数成功:', result.data);
        setRemainingCount(result.data.dosage);
      } else {
        console.warn('[GenerationLimit] 获取生图次数失败，使用默认次数10:', result.message);
        setRemainingCount(10);
      }
    } catch (error) {
      console.error('[GenerationLimit] 检查生图次数失败:', error);
      console.log('[GenerationLimit] 网络错误，使用默认次数10');
      setRemainingCount(10);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId]);

  // 消耗一次生成次数
  const consumeGeneration = useCallback(async (): Promise<boolean> => {
    try {
      const uid = await getUserId();
      if (!uid) {
        console.warn('[GenerationLimit] 未找到用户ID，无法消耗次数');
        return false;
      }

      console.log('[GenerationLimit] 消耗生成次数:', uid);
      const result = await authService.consumeUserDosage(uid);
      
      console.log('[GenerationLimit] 消耗次数API响应:', result);
      
      if (result.success && result.data) {
        console.log('[GenerationLimit] 消耗生成次数成功:', result.data);
        setRemainingCount(result.data.dosage);
        return result.data.canGenerate;
      } else {
        console.warn('[GenerationLimit] 消耗生成次数失败:', result.message);
        return false;
      }
    } catch (error) {
      console.error('[GenerationLimit] 消耗生成次数失败:', error);
      return false;
    }
  }, [getUserId]);

  // 重置剩余次数到默认值
  const resetRemainingCount = useCallback(async () => {
    try {
      const uid = await getUserId();
      if (!uid) {
        console.warn('[GenerationLimit] 未找到用户ID，无法重置次数');
        return false;
      }

      console.log('[GenerationLimit] 重置剩余次数:', uid);
      const result = await authService.resetUserDosage(uid);
      
      if (result.success && result.data) {
        console.log('[GenerationLimit] 重置剩余次数成功:', result.data);
        setRemainingCount(result.data.dosage);
        return true;
      } else {
        console.warn('[GenerationLimit] 重置剩余次数失败:', result.message);
        return false;
      }
    } catch (error) {
      console.error('[GenerationLimit] 重置剩余次数失败:', error);
      return false;
    }
  }, [getUserId]);

  // 获取剩余次数（不触发重置检查）
  const getRemainingCount = useCallback(async (): Promise<number> => {
    try {
      const uid = await getUserId();
      if (!uid) {
        console.log('[GenerationLimit] 未找到用户ID，返回默认次数10');
        return 10;
      }

      const result = await authService.checkUserDosage(uid);
      if (result.success && result.data) {
        // 更新本地状态
        setRemainingCount(result.data.dosage);
        return result.data.dosage;
      } else {
        console.log('[GenerationLimit] 获取生图次数失败，返回默认次数10');
        return 10;
      }
    } catch (error) {
      console.error('[GenerationLimit] 获取剩余次数失败:', error);
      console.log('[GenerationLimit] 网络错误，返回默认次数10');
      return 10;
    }
  }, [getUserId]);

  // 初始化时检查重置状态
  useEffect(() => {
    checkAndLoadCount();
  }, [checkAndLoadCount]);

  return {
    remainingCount,
    isLoading,
    consumeGeneration,
    getRemainingCount,
    resetRemainingCount,
    checkAndLoadCount,
    dailyLimit: 10
  };
};