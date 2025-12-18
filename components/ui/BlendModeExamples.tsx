import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';

// 示例图片资源
const SAMPLE_IMAGE = 'https://cdn-tos-cn.bytedance.net/obj/aipa-tos/4e5f9fcc-9145-41ac-bb70-35e14ea0f21c/img-laicai.png';

export const BlendModeExamples: React.FC = () => {
  // 混合模式列表及说明
  const blendModes = [
    { mode: 'normal' as const, description: '正常：默认模式，上层覆盖下层' },
    { mode: 'multiply' as const, description: '正片叠底：颜色相乘，变暗效果' },
    { mode: 'screen' as const, description: '滤色：反相后相乘再反相，变亮效果' },
    { mode: 'overlay' as const, description: '叠加：结合正片叠底和滤色' },
    { mode: 'darken' as const, description: '变暗：保留两个图层中较暗的颜色' },
    { mode: 'lighten' as const, description: '变亮：保留两个图层中较亮的颜色' },
    { mode: 'colorDodge' as const, description: '颜色减淡：使颜色变亮' },
    { mode: 'colorBurn' as const, description: '颜色加深：使颜色变暗' },
    { mode: 'hardLight' as const, description: '强光：加强对比度' },
    { mode: 'softLight' as const, description: '柔光：柔和的强光效果' },
    { mode: 'difference' as const, description: '差值：颜色差值，反色效果' },
    { mode: 'exclusion' as const, description: '排除：类似差值但对比度较低' },
    { mode: 'hue' as const, description: '色相：使用上层的色相和下层的饱和度、亮度' },
    { mode: 'saturation' as const, description: '饱和度：使用上层的饱和度和下层的色相、亮度' },
    { mode: 'color' as const, description: '颜色：使用上层的色相、饱和度和下层的亮度' },
    { mode: 'luminosity' as const, description: '亮度：使用上层的亮度和下层的色相、饱和度' },
  ];

  return (
    <SafeAreaContainer style={styles.container}>
      <Text style={styles.title}>React Native mixBlendMode 效果示例</Text>
      
      {blendModes.map((blendMode, index) => (
        <View key={index} style={styles.exampleContainer}>
          <Text style={styles.modeTitle}>{blendMode.mode}</Text>
          <Text style={styles.modeDescription}>{blendMode.description}</Text>
          
          <View style={styles.blendContainer}>
            {/* 背景渐变 */}
            <LinearGradient
              colors={['#9bf177', '#ff6b6b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            />
            
            {/* 上层图片，应用混合模式 */}
            <Image
              source={{ uri: SAMPLE_IMAGE }}
              style={[styles.overlayImage]}
              resizeMode="cover"
            />
          </View>
        </View>
      ))}
    </SafeAreaContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  exampleContainer: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  blendContainer: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});

export default BlendModeExamples;