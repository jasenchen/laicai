import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBarHeightProviderProps } from '@/types';

export const StatusBarHeightProvider: React.FC<StatusBarHeightProviderProps> = ({ 
  children 
}) => {
  const insets = useSafeAreaInsets();
  
  // 获取状态栏高度，Web端返回0
  const statusBarHeight = Platform.select({
    web: 0,
    default: insets.top,
  });

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarSpacer: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
});