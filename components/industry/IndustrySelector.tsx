import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  FlatList,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { IndustriesService } from '@/services/industriesService';
import { IndustryData } from '@/types/industries';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IndustrySelectorProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (primary: string, secondary: string) => void;
  initialPrimary?: string;
  initialSecondary?: string;
}

export const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  visible,
  onClose,
  onConfirm,
  initialPrimary,
  initialSecondary,
}) => {
  const [industryData, setIndustryData] = useState<IndustryData | null>(null);
  const [selectedPrimaryIndex, setSelectedPrimaryIndex] = useState<number>(0);
  const [selectedSecondaryIndex, setSelectedSecondaryIndex] = useState<number>(0);
  const slideAnim = useRef(new Animated.Value(404)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
  const isVisible = useRef(false);
  const secondaryListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      isVisible.current = true;
      loadData();
      // 重置动画位置
      slideAnim.setValue(404);
      overlayOpacityAnim.setValue(0);
      // 使用 requestAnimationFrame 确保在下一帧执行动画
      requestAnimationFrame(() => {
        if (isVisible.current) {
          showModal();
        }
      });
    } else {
      isVisible.current = false;
      hideModal();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const data = await IndustriesService.getIndustries();
      setIndustryData(data);
      
      // 设置默认选中值
      const primaryIndex = initialPrimary ? data.primaryCategories.indexOf(initialPrimary) : 0;
      const primary = initialPrimary || data.primaryCategories[0];
      const secondaryIndex = initialSecondary ? 
        data.secondaryCategories[primary]?.indexOf(initialSecondary) || 0 : 0;
      
      setSelectedPrimaryIndex(primaryIndex);
      setSelectedSecondaryIndex(secondaryIndex);
    } catch (error) {
      console.error('[IndustrySelector] 加载数据失败:', error);
    }
  };

  const showModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.36, 0.01, 0.1, 1),
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.36, 0.01, 0.1, 1),
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 404,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.bezier(0.36, 0.01, 0.1, 1),
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.bezier(0.36, 0.01, 0.1, 1),
      }),
    ]).start();
  };

  const handlePrimarySelect = (index: number) => {
    if (index !== selectedPrimaryIndex) {
      setSelectedPrimaryIndex(index);
      // 重置二级分类选择为第一个
      setSelectedSecondaryIndex(0);
      
      // 滚动二级列表到顶部
      setTimeout(() => {
        secondaryListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 0);
    }
  };

  const handleSecondarySelect = (index: number) => {
    setSelectedSecondaryIndex(index);
  };

  const handleConfirm = useCallback(() => {
    if (industryData) {
      const primary = industryData.primaryCategories[selectedPrimaryIndex];
      const secondary = industryData.secondaryCategories[primary]?.[selectedSecondaryIndex] || '';
      
      if (primary && secondary) {
        hideModal();
        setTimeout(() => {
          if (isVisible.current) {
            onConfirm(primary, secondary);
            onClose();
          }
        }, 250);
      }
    }
  }, [selectedPrimaryIndex, selectedSecondaryIndex, industryData, onConfirm, onClose]);

  const handleOverlayPress = useCallback(() => {
    hideModal();
    setTimeout(() => {
      if (isVisible.current) {
        onClose();
      }
    }, 250);
  }, [onClose]);



  const handlePrimaryScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / 48);
    if (index >= 0 && index !== selectedPrimaryIndex) {
      handlePrimarySelect(index);
      // 触发震动效果
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSecondaryScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / 48);
    if (index >= 0 && index !== selectedSecondaryIndex) {
      handleSecondarySelect(index);
      // 触发震动效果
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: overlayOpacityAnim }]}>
        <TouchableOpacity 
          style={styles.touchableArea} 
          onPress={handleOverlayPress}
        />
      </Animated.View>
      <Animated.View
        style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>你正在经营的行业</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.pickerContainer}>
            {/* 顶部渐变遮罩 - 放在容器最外层 */}
            <LinearGradient
              colors={['#ffffff', '#ffffff00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.topGradient}
            />
            {/* 底部渐变遮罩 - 放在容器最外层 */}
            <LinearGradient
              colors={['#ffffff00', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.bottomGradient}
            />
            
            {/* 一级行业选择器 */}
            <View style={styles.column}>
              <FlatList
                style={styles.flatList}
                data={industryData?.primaryCategories || []}
                keyExtractor={(item, index) => `primary-${index}`}
                showsVerticalScrollIndicator={false}
                snapToInterval={48}
                decelerationRate="fast"
                initialScrollIndex={selectedPrimaryIndex}
                getItemLayout={(data, index) => ({
                  length: 48,
                  offset: 48 * index,
                  index,
                })}
                contentContainerStyle={{ paddingTop: 72, paddingBottom: 72 }}
                scrollEventThrottle={1}
                onScroll={handlePrimaryScroll}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => handlePrimarySelect(index)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.itemText,
                      index === selectedPrimaryIndex && styles.selectedItemText
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {/* 选中指示器放在FlatList后面 */}
              <View style={[styles.selectionIndicator, styles.selectionIndicatorPrimary]} />
            </View>
            
            {/* 二级行业选择器 */}
            <View style={styles.column}>
              <FlatList
                ref={secondaryListRef}
                style={styles.flatList}
                data={industryData?.secondaryCategories[industryData?.primaryCategories[selectedPrimaryIndex]] || []}
                keyExtractor={(item, index) => `secondary-${index}`}
                showsVerticalScrollIndicator={false}
                snapToInterval={48}
                decelerationRate="fast"
                initialScrollIndex={selectedSecondaryIndex}
                getItemLayout={(data, index) => ({
                  length: 48,
                  offset: 48 * index,
                  index,
                })}
                contentContainerStyle={{ paddingTop: 72, paddingBottom: 72 }}
                scrollEventThrottle={1}
                onScroll={handleSecondaryScroll}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => handleSecondarySelect(index)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.itemText,
                      index === selectedSecondaryIndex && styles.selectedItemText
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {/* 选中指示器放在FlatList后面 */}
              <View style={[styles.selectionIndicator, styles.selectionIndicatorSecondary]} />
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>确认选择</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 43, 0.15)',
  },
  touchableArea: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f1e2b',
    lineHeight: 25,
  },
  content: {
    paddingHorizontal: 16,
    height: 192,
    overflow: 'hidden',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 192,
    position: 'relative',
  },
  column: {
    flex: 1,
    position: 'relative',
  },
  flatList: {
    flex: 1,
    zIndex: 1, // 确保FlatList在最顶层，可以接收触摸事件
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    top: 72, // 调整到72，让选中项居中显示
    right: 0,
    height: 48,
    backgroundColor: 'rgba(236, 242, 255, 0.14)', // #ECF2FF 14%透明度
    // 去掉borderWidth和borderColor
    pointerEvents: 'none', // 确保不阻挡触摸事件
  },
  selectionIndicatorPrimary: {
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  selectionIndicatorSecondary: {
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    zIndex: 2,
    pointerEvents: 'none',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    zIndex: 2,
    pointerEvents: 'none',
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
  },


  itemText: {
    fontSize: 15,
    color: '#0f1e2b',
    textAlign: 'center',
    lineHeight: 20,
    // 移除zIndex设置，让文字跟随父容器
  },
  selectedItemText: {
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 32,
  },
  confirmButton: {
    backgroundColor: '#0f1e2b',
    borderRadius: 100,
    paddingHorizontal: 127,
    paddingVertical: 13,
    minWidth: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});