import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaContainerProps } from '@/types';
import { Colors } from '@/constants/Colors';

export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({ 
  children, 
  style,
  excludeEdges = []
}) => {
  const insets = useSafeAreaInsets();
  
  // 为TabBar添加底部安全区域，确保不会被遮挡
  const tabBarSafeAreaStyle = Platform.select({
    web: {
      paddingBottom: 0,
    },
    default: {
      paddingBottom: excludeEdges.includes('bottom') ? 0 : insets.bottom,
    },
  });

  const containerStyle = Platform.select({
    web: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
    default: {
      paddingTop: excludeEdges.includes('top') ? 0 : insets.top,
      paddingBottom: excludeEdges.includes('bottom') ? 0 : insets.bottom,
      paddingLeft: excludeEdges.includes('left') ? 0 : insets.left,
      paddingRight: excludeEdges.includes('right') ? 0 : insets.right,
    },
  });

  return (
    <View style={[styles.container, containerStyle, style]}>
      <View style={[styles.content, tabBarSafeAreaStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
});