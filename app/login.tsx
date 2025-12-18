import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, ScrollView, Keyboard } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { authService } from '@/services/authService';
import { AuthResponse } from '@/types/auth';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IndustrySelector } from '@/components/industry';

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

export default function LoginScreen() {
  const router = useRouter();
  const [logoSvgUri, setLogoSvgUri] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [primaryIndustry, setPrimaryIndustry] = useState('');
  const [secondaryIndustry, setSecondaryIndustry] = useState('');
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [industryError, setIndustryError] = useState<string | null>(null);
  const [arrowSvgUri, setArrowSvgUri] = useState<string | null>(null);

  // 组件挂载时初始化用户手机号
  useEffect(() => {
    const initializeUserPhones = async () => {
      try {
        console.log('[LoginScreen] 初始化用户手机号');
        await authService.initUserPhones();
        console.log('[LoginScreen] 用户手机号初始化完成');
      } catch (error) {
        console.error('[LoginScreen] 用户手机号初始化失败:', error);
      }
    };

    initializeUserPhones();
    (async () => {
      try {
        const svg = Asset.fromModule(require('../assets/UI/slogan.svg'));
        await svg.downloadAsync();
        setLogoSvgUri(svg.localUri || svg.uri);
      } catch {}
    })();
    (async () => {
      try {
        const arrow = Asset.fromModule(require('../assets/UI/arrow-down.svg'));
        await arrow.downloadAsync();
        setArrowSvgUri(arrow.localUri || arrow.uri);
      } catch {}
    })();
  }, []);

  // 验证手机号格式
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 格式化手机号输入
  const formatPhoneNumber = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 11) {
      return cleaned.substring(0, 11);
    }
    return cleaned;
  };

  // 处理登录
  const handleLogin = async () => {
    // 重置错误提示
    setPhoneError(null);
    setIndustryError(null);
    setError(null);

    // 表单校验
    let hasError = false;
    
    // 验证手机号
    if (!phone.trim()) {
      setPhoneError('请输入手机号');
      hasError = true;
    } else if (!validatePhone(phone)) {
      setPhoneError('请输入正确的11位手机号');
      hasError = true;
    }

    // 验证行业
    if (!industry.trim()) {
      setIndustryError('请选择你的行业');
      hasError = true;
    }

    // 如果有错误，不执行登录
    if (hasError) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('[LoginScreen] 开始验证手机号:', phone);
      const response: AuthResponse = await authService.verifyPhone(phone);

      if (response.success) {
        console.log('[LoginScreen] 手机号验证成功，开始保存行业信息:', response.data);
        
        try {
          // 更新用户行业信息
          const industryUpdateResponse = await authService.updatePhoneIndustry(
            response.data?.uid || '',
            {
              primary: primaryIndustry,
              secondary: secondaryIndustry
            }
          );
          
          if (industryUpdateResponse.success) {
            console.log('[LoginScreen] 行业信息保存成功:', industryUpdateResponse.data);
          } else {
            console.warn('[LoginScreen] 行业信息保存失败:', industryUpdateResponse.message);
          }
        } catch (industryError) {
          console.error('[LoginScreen] 保存行业信息时发生错误:', industryError);
          // 行业信息保存失败不影响登录流程
        }
        
        try {
          // 初始化用户生图次数（如果需要）
          const dosageCheckResponse = await authService.checkUserDosage(response.data?.uid || '');
          if (dosageCheckResponse.success) {
            console.log('[LoginScreen] 用户生图次数初始化成功:', dosageCheckResponse.data);
          } else {
            console.warn('[LoginScreen] 用户生图次数初始化失败:', dosageCheckResponse.message);
          }
        } catch (dosageError) {
          console.error('[LoginScreen] 检查用户生图次数时发生错误:', dosageError);
          // 生图次数检查失败不影响登录流程
        }
        
        try {
          await AsyncStorage.setItem('isAuthenticated', 'true');
          await AsyncStorage.setItem('userUid', response.data?.uid || '');
          await AsyncStorage.setItem('userPhone', response.data?.phone || '');
          await AsyncStorage.setItem('userIndustry', JSON.stringify({
            primary: primaryIndustry,
            secondary: secondaryIndustry
          }));
          router.replace('/');
        } catch (error) {
          console.error('[LoginScreen] 保存登录状态失败:', error);
          Alert.alert('错误', '保存登录状态失败，请重试');
        }
      } else {
        console.log('[LoginScreen] 登录失败:', response.message);
        setError(response.message || '手机号验证失败');
      }
    } catch (error: any) {
      console.error('[LoginScreen] 登录异常:', error);
      // 根据错误信息判断具体错误类型
      if (error.message && error.message.includes('手机号')) {
        setError('手机号错误，请重新输入');
      } else if (error.message && error.message.includes('网络')) {
        setError('网络异常，请重试');
      } else {
        setError('登录失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (text: string) => {
    const formattedPhone = formatPhoneNumber(text);
    setPhone(formattedPhone);
    // 清除手机号错误提示
    if (phoneError) {
      setPhoneError(null);
    }
    // 清除全局错误提示
    if (error) {
      setError(null);
    }
  };

  // 处理行业选择
  const handleIndustrySelect = () => {
    // 先关闭键盘，避免冲突
    Keyboard.dismiss();
    // 延迟显示行业选择器，确保键盘完全收起
    setTimeout(() => {
      setShowIndustrySelector(true);
    }, 50);
  };

  // 处理行业选择确认
  const handleIndustryConfirm = (primary: string, secondary: string) => {
    setPrimaryIndustry(primary);
    setSecondaryIndustry(secondary);
    setIndustry(`${primary}-${secondary}`);
    setShowIndustrySelector(false);
    // 清除行业错误提示
    if (industryError) {
      setIndustryError(null);
    }
    // 清除全局错误提示
    if (error) {
      setError(null);
    }
  };

  // 关闭行业选择器
  const handleIndustryClose = () => {
    setShowIndustrySelector(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* 顶部装饰区域 */}
      <View style={styles.topDecoration}>
        <Image
          source={require('../assets/UI/bg layer.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      {/* 主要内容区域 */}
      <View style={styles.mainContent}>
        {/* Logo和标题容器 */}
        <View style={styles.logoContainer}>
          {logoSvgUri ? (
            <SvgUri width={299} height={95} uri={logoSvgUri} style={styles.logoImage} />
          ) : null}
        </View>

        {/* 输入表单 */}
        <View style={styles.formContainer}>
          {/* 手机号输入 */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Text style={styles.emojiIcon}>📱</Text>
              <Text style={styles.labelText}>手机号</Text>
            </View>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+ 86</Text>
              <TextInput
              style={[
                styles.phoneInput,
                phone && styles.phoneInputFilled,
                phoneError && styles.phoneInputError
              ]}
              placeholder="请输入你的手机号"
              placeholderTextColor="#a2a8b6"
              value={phone}
              onChangeText={handleInputChange}
              keyboardType="phone-pad"
              maxLength={11}
              editable={!isLoading}
            />
            </View>

            {/* 手机号错误提示 */}
            {phoneError && (
              <View style={styles.fieldErrorContainer}>
                <Text style={styles.fieldErrorText}>{phoneError}</Text>
              </View>
            )}
          </View>

          {/* 行业选择 */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Text style={styles.emojiIcon}>📍</Text>
              <Text style={styles.labelText}>你的行业</Text>
            </View>
            <TouchableOpacity style={styles.industryInputContainer} onPress={handleIndustrySelect}>
              <Text style={industry ? styles.industryText : styles.industryPlaceholder}>
                {industry || '请选择你的行业'}
              </Text>
              <View style={styles.arrowContainer}>
                {arrowSvgUri ? (
                  <SvgUri width={16} height={16} uri={arrowSvgUri} />
                ) : null}
              </View>
            </TouchableOpacity>

            {/* 行业错误提示 */}
            {industryError && (
              <View style={styles.fieldErrorContainer}>
                <Text style={styles.fieldErrorText}>{industryError}</Text>
              </View>
            )}
          </View>


        </View>

        {/* 错误提示 */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 登录按钮 */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            isLoading && styles.loginButtonDisabled
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>登录</Text>
          )}
        </TouchableOpacity>
        
        {/* 行业选择器 */}
        <IndustrySelector
          visible={showIndustrySelector}
          onClose={handleIndustryClose}
          onConfirm={handleIndustryConfirm}
          initialPrimary={primaryIndustry}
          initialSecondary={secondaryIndustry}
        />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  topDecoration: {
    width: '100%',
    height: 279,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 14,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 299,
    height: 95,
  },
  formContainer: {
    width: '100%',
    flexShrink: 0,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    marginBottom: 16,
  },
  emojiIcon: {
    fontSize: 16,
    minWidth: 16,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f1e2b',
    marginLeft: 4,
    lineHeight: 22,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceff6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f1e2b',
    minWidth: 30,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#a2a8b6',
    marginLeft: 18,
    paddingVertical: 16,
  },
  phoneInputFilled: {
    color: '#0F1E2B',
    fontWeight: '600',
  },
  phoneInputError: {
    color: '#ff3b30',
  },
  industryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eceff6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 17,
    height: 54,
  },
  industryPlaceholder: {
    fontSize: 14,
    color: '#a2a8b6',
    minWidth: 98,
  },
  industryText: {
    fontSize: 14,
    color: '#0F1E2B',
    fontWeight: '600',
    minWidth: 98,
  },
  arrowContainer: {
    width: 16,
    height: 16,
  },
  arrowIcon: {
    width: 16,
    height: 16,
  },
  errorContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1e2b',
    borderRadius: 100,
    paddingHorizontal: 141,
    paddingVertical: 13,
    height: 54,
    minWidth: 28,
  },
  loginButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 20,
  },
  fieldErrorContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#ff3b30',
    lineHeight: 16,
  },
});
