import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IcLogo } from '@/components/ui/IcLogo';
import { HomeHeader } from '@/components/home/HomeHeader';
import { FeatureGrid } from '@/components/home/FeatureGrid';
import { ChatBar } from '@/components/home/ChatBar';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // 获取状态栏高度，Web端返回0
  const statusBarHeight = Platform.OS === 'web' ? 0 : insets.top;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
        if (isAuthenticated !== 'true') {
          router.replace('/login');
        }
      } catch (error) {
        console.error('[HomeScreen] 检查认证失败:', error);
        router.replace('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingTop: statusBarHeight }]} 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
          {/* Logo移入ScrollView内，跟随滚动 */}
          <View style={styles.logoContainer}>
            <IcLogo />
          </View>
          
          <HomeHeader />
          <View style={styles.spacing} />
          <FeatureGrid />
          {/* 底部占位，避免被 ChatBar 遮挡 */}
          <View style={{ height: 120 }} />
        </ScrollView>
        <View style={styles.bottomContainer}>
          <ChatBar />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    // 让ScrollView可以延伸到状态栏区域
    paddingTop: 0,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 37,
  },
  scroll: { 
    paddingBottom: 0,
    // 确保内容可以从状态栏开始显示
    paddingTop: 0,
  },
  spacing: {
    height: 26,
  },
  bottomContainer: {
    width: '100%',
    paddingBottom: 8,
  },
});