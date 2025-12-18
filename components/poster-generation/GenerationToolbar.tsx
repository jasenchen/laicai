import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { Colors } from '@/constants/Colors';
import { AspectRatio, ASPECT_RATIOS } from '@/types/aspectRatio';
import { AspectRatioSelector } from './AspectRatioSelector';

interface GenerationToolbarProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  remainingCount: number;
  parallelImageCount?: number;
  onParallelImageCountChange?: (count: number) => void;
  onResetRemainingCount?: () => void;
  currentPrompt?: string;
  systemReferenceImage?: string;
  finalApiParams?: object;
  responseFormat?: 'url' | 'base64';
  onResponseFormatChange?: (format: 'url' | 'base64') => void;
  hasActiveGeneration?: boolean;
  hasCompletedGeneration?: boolean;
}

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

const SETTING_SVG = Asset.fromModule(require('../../assets/UI/ic-setting.svg'));

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aspectRatioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  aspectRatioIcon: {
    width: 16,
    height: 16,
  },
  aspectRatioText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Barlow',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remainingCountText: {
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    minWidth: 67,
  },
  generateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 4,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    minWidth: 80,
  },
  generateButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#0F1E2B',
    minWidth: 28,
  },
});

export const GenerationToolbar: React.FC<GenerationToolbarProps> = ({
  aspectRatio,
  onAspectRatioChange,
  isGenerating,
  onGenerate,
  remainingCount,
  parallelImageCount = 4,
  onParallelImageCountChange,
  onResetRemainingCount,
  currentPrompt,
  systemReferenceImage,
  finalApiParams,
  responseFormat,
  onResponseFormatChange,
  hasActiveGeneration = false,
  hasCompletedGeneration = false,
}) => {
  const [showAspectRatioSelector, setShowAspectRatioSelector] = useState(false);
  
  // 防止重复点击的状态必须在使用前声明
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // 根据生成状态确定按钮文案
  const getButtonText = () => {
    if (hasActiveGeneration) {
      return '生成中';
    }
    if (hasCompletedGeneration) {
      return '查看结果';
    }
    return isGenerating ? '生成中' : '生成';
  };
  
  // 确定按钮是否禁用 - 生成中状态允许点击跳转
  const isButtonDisabled = isGenerating && !hasActiveGeneration;

  const handleAspectRatioPress = () => {
    setShowAspectRatioSelector(true);
  };

  const handleAspectRatioConfirm = (selectedAspectRatio: AspectRatio) => {
    onAspectRatioChange(selectedAspectRatio.name);
  };

  const handleAspectRatioClose = () => {
    setShowAspectRatioSelector(false);
  };


  // 处理按钮点击，防止重复执行
  const handleGeneratePress = useCallback(() => {
    if (isButtonPressed || isButtonDisabled) {
      return;
    }
    
    console.log('[GenerationToolbar] 按钮点击，执行生成');
    setIsButtonPressed(true);
    
    // 使用短暂延迟防止重复点击
    setTimeout(() => {
      setIsButtonPressed(false);
      onGenerate();
    }, 100);
  }, [isButtonPressed, isButtonDisabled, onGenerate]);

  const handleParallelImageCountChange = (count: number) => {
    onParallelImageCountChange?.(count);
  };


  // 根据当前比例找到对应的AspectRatio对象
  const getCurrentAspectRatio = (): AspectRatio => {
    return ASPECT_RATIOS.find(ar => ar.name === aspectRatio) || ASPECT_RATIOS[0];
  };

  return (
    <View style={styles.container}>
      {/* 左侧区域：只有比例选择按钮 */}
      <View style={styles.leftContainer}>
        {/* 宽高比选择按钮 */}
        <TouchableOpacity 
          style={styles.aspectRatioContainer}
          onPress={handleAspectRatioPress}
        >
          <SvgIcon 
            uri={SETTING_SVG.uri}
            width={16}
            height={16}
            style={styles.aspectRatioIcon}
          />
          <Text style={styles.aspectRatioText}>{aspectRatio}</Text>
        </TouchableOpacity>
      </View>

      {/* 右侧区域：剩余次数 + 生成按钮 */}
      <View style={styles.rightContainer}>
        <Text style={styles.remainingCountText}>
          今日可用 {remainingCount} 次
        </Text>
        
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGeneratePress}
          disabled={isButtonDisabled || isButtonPressed}
        >
          <Text style={styles.generateButtonText}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 比例选择器弹窗 */}
      <AspectRatioSelector
        visible={showAspectRatioSelector}
        onClose={handleAspectRatioClose}
        onConfirm={handleAspectRatioConfirm}
        initialAspectRatio={getCurrentAspectRatio()}
      />

    </View>
  );
};
