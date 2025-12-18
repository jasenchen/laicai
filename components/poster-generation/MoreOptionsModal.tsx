import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Modal, Platform, Image, ScrollView, Dimensions } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';

interface MoreOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onParallelImageCountChange: (count: number) => void;
  onResetRemainingCount: () => void;
  currentImageCount: number;
  currentPrompt?: string;
  systemReferenceImage?: string;
  finalApiParams?: object;
  responseFormat: 'url' | 'base64';
  onResponseFormatChange: (format: 'url' | 'base64') => void;
  hasActiveGeneration: boolean;
  hasCompletedGeneration: boolean;
}

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#2E2E32',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: 280,
    maxHeight: Dimensions.get('window').height * 0.95,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  titleText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Barlow',
  },
  closeButton: {
    padding: 8,
  },
  settingItemContainer: {
    marginBottom: 24,
  },
  settingItemTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'Barlow',
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    fontFamily: 'Barlow',
  },
  promptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  promptText: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Barlow',
  },
  systemImageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  systemImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    resizeMode: 'cover',
  },
  systemImageLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontFamily: 'Barlow',
  },
  noImageText: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'Barlow',
  },
  countSelectorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countButton: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  countButtonText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Barlow',
  },
  countButtonTextSelected: {
    color: '#0F1E2B',
  },
  simulateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
  },
  simulateButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#0F1E2B',
    fontFamily: 'Barlow',
  },
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Barlow',
  },

  closeIcon: {
    width: 16,
    height: 16,
    transform: [{ rotate: '180deg' }],
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  apiParamsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  apiParamsTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Barlow',
  },
  apiParamsCode: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    padding: 12,
    fontFamily: 'Courier',
    fontSize: 11,
    lineHeight: 14,
    color: '#E8E8E8',
    // 移除maxHeight高度限制，让代码完整显示
  },
  apiParamsText: {
    color: '#00FF88',
  },
});

export const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({
  visible,
  onClose,
  onParallelImageCountChange,
  onResetRemainingCount,
  currentImageCount,
  currentPrompt,
  systemReferenceImage,
  finalApiParams,
  responseFormat,
  onResponseFormatChange,
  hasActiveGeneration,
  hasCompletedGeneration,
}) => {
  const imageCounts = [1, 2, 3, 4];
  const responseFormats: Array<'url' | 'base64'> = ['url', 'base64'];

  // 处理背景点击，关闭弹窗
  const handleBackgroundPress = () => {
    onClose();
  };

  // 阻止内容区域的触摸事件传递到背景
  const handleContentPress = (e: any) => {
    e.stopPropagation();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* 背景遮罩层 - 点击背景关闭弹窗 */}
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
          <View style={styles.absoluteFill} />
        </TouchableWithoutFeedback>
        {/* Modal内容容器 */}
        <View style={styles.modalContainer} onTouchEnd={(e) => e.stopPropagation()}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              directionalLockEnabled={true}
              decelerationRate="fast"
            >
            {/* 标题区域 */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>更多选项</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
              >
                {(() => {
                  const BACK_SVG = Asset.fromModule(require('../../assets/UI/arrow-back.svg'));
                  return (
                    <SvgUri width={16} height={16} uri={BACK_SVG.uri} style={styles.closeIcon} />
                  );
                })()}
              </TouchableOpacity>
            </View>

            {/* 当前提示词展示 */}
            <View style={styles.settingItemContainer}>
              <Text style={styles.settingItemTitle}>当前提示词</Text>
              <Text style={styles.settingDescription}>
                当前选中的风格所使用的生成提示词
              </Text>
              <View style={styles.promptContainer}>
                <Text style={styles.promptText}>
                  {currentPrompt || '暂无提示词'}
                </Text>
              </View>
            </View>

            {/* 系统默认参考图展示 */}
            <View style={styles.settingItemContainer}>
              <Text style={styles.settingItemTitle}>系统默认参考图</Text>
              <Text style={styles.settingDescription}>
                当前风格配置的系统级默认参考图（不显示在页面上）
              </Text>
              <View style={styles.systemImageContainer}>
                {systemReferenceImage ? (
                  <>
                    <Image 
                      source={{ uri: systemReferenceImage }}
                      style={styles.systemImage}
                    />
                    <Text style={styles.systemImageLabel}>系统默认参考图</Text>
                  </>
                ) : (
                  <Text style={styles.noImageText}>当前风格无系统默认参考图</Text>
                )}
              </View>
            </View>

            {/* 并行生图数量设置 */}
            <View style={styles.settingItemContainer}>
              <Text style={styles.settingItemTitle}>并行生图数量</Text>
              <Text style={styles.settingDescription}>
                设置每次生成图片的数量，同时执行多个生图请求，提高生成效率
              </Text>
              <View style={styles.countSelectorContainer}>
                {imageCounts.map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.countButton,
                      currentImageCount === count && styles.countButtonSelected,
                    ]}
                    onPress={() => onParallelImageCountChange(count)}
                  >
                    <Text style={[
                      styles.countButtonText,
                      currentImageCount === count && styles.countButtonTextSelected,
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 返回格式设置 */}
            <View style={styles.settingItemContainer}>
              <Text style={styles.settingItemTitle}>返回格式</Text>
              <Text style={styles.settingDescription}>
                选择图片返回格式，URL格式适用于常规使用，Base64格式适用于特殊需求
              </Text>
              <View style={styles.countSelectorContainer}>
                {responseFormats.map((format) => (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.countButton,
                      responseFormat === format && styles.countButtonSelected,
                    ]}
                    onPress={() => onResponseFormatChange(format)}
                  >
                    <Text style={[
                      styles.countButtonText,
                      responseFormat === format && styles.countButtonTextSelected,
                    ]}>
                      {format.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 生图数量设置 - 已移至并行生图数量设置 */}

            {/* 调试选项已移除模拟生图 */}

            {/* 重置剩余次数按钮 */}
            <View style={styles.settingItemContainer}>
              <Text style={styles.settingItemTitle}>管理选项</Text>
              <Text style={styles.settingDescription}>
                重置今日剩余生成次数为默认值（用于测试）
              </Text>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => {
                  onResetRemainingCount();
                  onClose();
                }}
              >
                <Text style={styles.resetButtonText}>重置剩余次数</Text>
              </TouchableOpacity>
            </View>

            {/* API参数展示 */}
            {finalApiParams && (
              <View style={styles.settingItemContainer}>
                <Text style={styles.apiParamsTitle}>API参数代码</Text>
                <Text style={styles.settingDescription}>
                  最终传递给seedream的完整参数（JSON格式）
                </Text>
                <View style={styles.apiParamsContainer}>
                  <Text style={styles.apiParamsCode}>
                    {JSON.stringify(finalApiParams, null, 2)}
                  </Text>
                </View>
              </View>
            )}
            </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
