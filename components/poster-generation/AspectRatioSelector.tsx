import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { AspectRatio, ASPECT_RATIOS } from '@/types/aspectRatio';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 计算比例选择器的实际高度
const MODAL_HEADER_HEIGHT = 65; // header高度 (20+20+padding)
const MODAL_BODY_HEIGHT = 344; // body高度
const MODAL_FOOTER_HEIGHT = 104; // footer高度 (24+24+56)
const MODAL_TOTAL_HEIGHT = MODAL_HEADER_HEIGHT + MODAL_BODY_HEIGHT + MODAL_FOOTER_HEIGHT + 20; // 加一些额外间距

interface AspectRatioSelectorProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (aspectRatio: AspectRatio) => void;
  initialAspectRatio?: AspectRatio;
}

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  // 在移动端使用SvgUri组件显示SVG
  return <SvgUri width={width} height={height} uri={uri} style={style} />;
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  visible,
  onClose,
  onConfirm,
  initialAspectRatio,
}) => {
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(initialAspectRatio || ASPECT_RATIOS[0]);
  const slideAnim = useRef(new Animated.Value(MODAL_TOTAL_HEIGHT)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;
  const isVisible = useRef(false);

  useEffect(() => {
    if (visible) {
      isVisible.current = true;
      // 设置初始选中值
      if (initialAspectRatio) {
        setSelectedAspectRatio(initialAspectRatio);
      }
      
      // 重置动画位置
      slideAnim.setValue(MODAL_TOTAL_HEIGHT);
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
  }, [visible, initialAspectRatio]);

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
        toValue: MODAL_TOTAL_HEIGHT,
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

  const handleAspectRatioSelect = (aspectRatio: AspectRatio) => {
    setSelectedAspectRatio(aspectRatio);
    // 触发震动效果
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirm = useCallback(() => {
    hideModal();
    setTimeout(() => {
      if (isVisible.current) {
        onConfirm(selectedAspectRatio);
        onClose();
      }
    }, 250);
  }, [selectedAspectRatio, onConfirm, onClose]);

  const handleOverlayPress = useCallback(() => {
    hideModal();
    setTimeout(() => {
      if (isVisible.current) {
        onClose();
      }
    }, 250);
  }, [onClose]);

  // 按照Figma模板的布局重新排列数据
  const columns = [
    [ASPECT_RATIOS[0], ASPECT_RATIOS[1], ASPECT_RATIOS[8]],  // 正方形、3:2、抖音团购
    [ASPECT_RATIOS[2], ASPECT_RATIOS[5], ASPECT_RATIOS[9]],  // 3:4、9:16、电商通用
    [ASPECT_RATIOS[3], ASPECT_RATIOS[6], ASPECT_RATIOS[10]], // 4:3、16:9、美团
    [ASPECT_RATIOS[4], ASPECT_RATIOS[7], ASPECT_RATIOS[11]]  // 2:3、21:9、小红书推荐
  ];

  const renderAspectRatioItem = (aspectRatio: AspectRatio, index: number) => {
    const isSelected = selectedAspectRatio.id === aspectRatio.id;
    
    if (aspectRatio.scene) {
      // 场景类型的比例（抖音团购、电商通用等）
      return (
        <View style={styles.sceneContainer}>
          <TouchableOpacity
            style={[
              styles.sceneIconContainer,
              isSelected && styles.sceneIconContainerSelected
            ]}
            onPress={() => handleAspectRatioSelect(aspectRatio)}
            activeOpacity={0.8}
          >
            <SvgIcon
              uri={aspectRatio.icon}
              width={48}
              height={48}
            />
          </TouchableOpacity>
          <View style={styles.sceneInfo}>
            <Text style={[
              styles.sceneName,
              isSelected && styles.sceneNameSelected
            ]}>
              {aspectRatio.name}
            </Text>
            <Text style={styles.sceneDimensions}>{aspectRatio.scene}</Text>
          </View>
        </View>
      );
    } else {
      // 标准比例
      return (
        <TouchableOpacity
          style={styles.ratioContainer}
          onPress={() => handleAspectRatioSelect(aspectRatio)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.ratioIconContainer,
            isSelected && styles.ratioIconContainerSelected
          ]}>
            <SvgIcon
              uri={aspectRatio.icon}
              width={48}
              height={48}
            />
          </View>
          <Text style={[
            styles.ratioName,
            isSelected && styles.ratioNameSelected
          ]}>
            {aspectRatio.name}
          </Text>
        </TouchableOpacity>
      );
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>选择尺寸或使用的场景</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.columnsContainer}>
            {columns.map((column, columnIndex) => (
              <View key={columnIndex} style={styles.column}>
                {column.map((aspectRatio, itemIndex) => (
                  <View key={aspectRatio.id} style={styles.itemContainer}>
                    {renderAspectRatioItem(aspectRatio, columnIndex * 3 + itemIndex)}
                    {itemIndex < column.length - 1 && (
                      <View style={itemIndex === 0 ? styles.standardSeparator : styles.sceneSeparator} />
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
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
    backgroundColor: '#25262a',
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
    color: '#ffffff',
    lineHeight: 25,
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: 21,
    height: 344,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: '100%',
  },
  column: {
    width: 81,
    alignItems: 'center',
  },
  itemContainer: {
    alignItems: 'center',
    width: '100%',
  },
  ratioContainer: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  ratioIconContainer: {
    width: '100%',
    height: 81,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0,
  },
  ratioIconContainerSelected: {
    borderWidth: 2,
    borderColor: '#74E443',
  },
  ratioName: {
    fontSize: 11,
    color: '#fffffff2',
    textAlign: 'center',
  },
  ratioNameSelected: {
    fontWeight: '600',
    color: '#ffffff',
  },
  sceneContainer: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  sceneIconContainer: {
    width: '100%',
    height: 81,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0,
  },
  sceneIconContainerSelected: {
    borderWidth: 2,
    borderColor: '#74E443',
  },
  sceneInfo: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  sceneName: {
    fontSize: 11,
    color: '#fffffff2',
    textAlign: 'center',
  },
  sceneNameSelected: {
    fontWeight: '600',
    color: '#ffffff',
  },
  sceneDimensions: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  separator: {
    height: 12,
  },
  standardSeparator: {
    height: 12,
  },
  sceneSeparator: {
    height: 10,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 127,
    paddingVertical: 13,
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 100,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f1e2b',
    lineHeight: 20,
    minWidth: 56,
  },
});