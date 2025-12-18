import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, TouchableOpacity, Image, StyleSheet, Text, Platform, Animated, Dimensions } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PinchGestureHandler, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { BlurView } from 'expo-blur';

// 创建Animated.Image组件以支持动画
const AnimatedImage = Animated.createAnimatedComponent(Image);

// SVG图标组件 - 兼容Web和移动端
const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

// 返回按钮组件 - 使用指定的白色图标
const BackIcon = () => (
  <SvgIcon
    width={18}
    height={18}
    uri="https://cdn-tos-cn.bytedance.net/obj/aipa-tos/c2fd1ed8-7821-4e01-a1a4-fcbc5d0355f3/arrow-back.svg"
    style={{ tintColor: '#ffffff' }}
  />
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  animatedContainer: {
    flex: 1,
    width: '100%',
  },
});

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
  // iOS相册动画所需的原始图片位置信息
  sourceRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUrl,
  onClose,
  sourceRect
}) => {
  const insets = useSafeAreaInsets();
  
  // 使用 useRef 管理动画值，避免 Web 端初始化问题
  const translateYRef = useRef(Platform.OS !== 'web' ? new Animated.Value(0) : null);
  const opacityRef = useRef(Platform.OS !== 'web' ? new Animated.Value(0) : null);
  const scaleRef = useRef(Platform.OS !== 'web' ? new Animated.Value(1) : null);
  const positionXRef = useRef(Platform.OS !== 'web' ? new Animated.Value(0) : null);
  const positionYRef = useRef(Platform.OS !== 'web' ? new Animated.Value(0) : null);
  const baseScaleRef = useRef(Platform.OS !== 'web' ? new Animated.Value(1) : null);
  const pinchScaleRef = useRef(Platform.OS !== 'web' ? new Animated.Value(1) : null);
  
  const [imageError, setImageError] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  // 进入和退出动画
  useEffect(() => {
    if (visible && imageUrl) {
      setImageError(false);
      setIsClosing(false);
      setIsPinching(false);
      
      if (Platform.OS === 'web') {
        if (opacityRef.current) opacityRef.current.setValue(1);
        return;
      }
      
      // 重置动画值
      if (translateYRef.current) translateYRef.current.setValue(0);
      if (baseScaleRef.current) baseScaleRef.current.setValue(1);
      if (pinchScaleRef.current) pinchScaleRef.current.setValue(1);
      
      // iOS相册进入动画
      if (sourceRect && scaleRef.current && positionXRef.current && positionYRef.current && opacityRef.current) {
        const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
        
        // 计算全屏显示时图片的最终尺寸
        const screenAspectRatio = screenWidth / screenHeight;
        const imageAspectRatio = sourceRect.width / sourceRect.height;
        
        let finalWidth, finalHeight;
        if (imageAspectRatio > screenAspectRatio) {
          // 图片更宽，以宽度为准
          finalWidth = screenWidth * 0.9;
          finalHeight = finalWidth / imageAspectRatio;
        } else {
          // 图片更高，以高度为准
          finalHeight = screenHeight * 0.9;
          finalWidth = finalHeight * imageAspectRatio;
        }
        
        // 计算缩放比例（从缩略图到全屏）
        const scale = finalWidth / sourceRect.width;
        
        // 计算位置（从缩略图位置到屏幕中心）
        const finalCenterX = screenWidth / 2;
        const finalCenterY = screenHeight / 2;
        const sourceCenterX = sourceRect.x + sourceRect.width / 2;
        const sourceCenterY = sourceRect.y + sourceRect.height / 2;
        
        const translateX = finalCenterX - sourceCenterX;
        const translateY = finalCenterY - sourceCenterY;
        
        // 设置初始值（从缩略图位置开始）
        scaleRef.current.setValue(1 / scale);
        positionXRef.current.setValue(translateX / scale);
        positionYRef.current.setValue(translateY / scale);
        opacityRef.current.setValue(1); // 不使用透明度动画，保持连贯性
        
        // 执行进入动画
        Animated.parallel([
          Animated.timing(scaleRef.current, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(positionXRef.current, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(positionYRef.current, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // 没有原始位置信息，使用简单的淡入效果
        if (opacityRef.current) {
          opacityRef.current.setValue(0);
          Animated.timing(opacityRef.current, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  }, [visible, imageUrl, sourceRect]);

  const handleClose = () => {
    if (isClosing) return; // 防止重复调用
    
    if (Platform.OS === 'web') {
      onClose();
      return;
    }
    
    setIsClosing(true);
    
    if (baseScaleRef.current) {
      Animated.timing(baseScaleRef.current, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onClose();
      });
    } else {
      onClose();
    }
  };

  const handleCloseWithAnimation = () => {
    if (isClosing) return; // 防止重复调用
    
    if (Platform.OS === 'web' || !opacityRef.current) {
      onClose();
      return;
    }
    
    setIsClosing(true);
    
    // iOS相册退出动画
    if (sourceRect && scaleRef.current && positionXRef.current && positionYRef.current) {
      const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
      
      // 计算全屏显示时图片的最终尺寸
      const screenAspectRatio = screenWidth / screenHeight;
      const imageAspectRatio = sourceRect.width / sourceRect.height;
      
      let finalWidth, finalHeight;
      if (imageAspectRatio > screenAspectRatio) {
        // 图片更宽，以宽度为准
        finalWidth = screenWidth * 0.9;
        finalHeight = finalWidth / imageAspectRatio;
      } else {
        // 图片更高，以高度为准
        finalHeight = screenHeight * 0.9;
        finalWidth = finalHeight * imageAspectRatio;
      }
      
      // 计算缩放比例（从缩略图到全屏）
      const scale = finalWidth / sourceRect.width;
      
      // 计算位置（从缩略图位置到屏幕中心）
      const finalCenterX = screenWidth / 2;
      const finalCenterY = screenHeight / 2;
      const sourceCenterX = sourceRect.x + sourceRect.width / 2;
      const sourceCenterY = sourceRect.y + sourceRect.height / 2;
      
      const translateX = finalCenterX - sourceCenterX;
      const translateY = finalCenterY - sourceCenterY;
      
      // 执行退出动画
      Animated.parallel([
        Animated.timing(scaleRef.current, {
          toValue: 1 / scale,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(positionXRef.current, {
          toValue: translateX / scale,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(positionYRef.current, {
          toValue: translateY / scale,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
      });
    } else {
      // 没有原始位置信息，使用简单的淡出效果
      if (opacityRef.current && translateYRef.current) {
        Animated.parallel([
          Animated.timing(translateYRef.current, {
            toValue: 300,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacityRef.current, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
      } else {
        onClose();
      }
    }
  };

  const handleImageError = (error: any) => {
    console.error('[ImageViewerModal] 图片加载失败:', error);
    setImageError(true);
  };

  // 手势处理
  const onGestureEvent = Platform.OS !== 'web' && translateYRef.current && !isPinching ? Animated.event(
    [{ nativeEvent: { translationY: translateYRef.current } }],
    { useNativeDriver: true }
  ) : undefined;

  const onHandlerStateChange = (event: any) => {
    if (Platform.OS === 'web' || isClosing || isPinching) {
      return;
    }
    
    if (event.nativeEvent.state === 5) {
      const { translationY, velocityY } = event.nativeEvent;
      
      if (translationY > 60 || velocityY > 500) {
        handleCloseWithAnimation();
      } else {
        if (translateYRef.current) {
          Animated.spring(translateYRef.current, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      }
    }
  };

  // 双指缩放手势处理
  const onPinchGestureEvent = Platform.OS !== 'web' && pinchScaleRef.current ? Animated.event(
    [{ nativeEvent: { scale: pinchScaleRef.current } }],
    { useNativeDriver: true }
  ) : undefined;

  const onPinchHandlerStateChange = (event: any) => {
    if (Platform.OS === 'web') {
      return;
    }

    if (event.nativeEvent.state === 4) {
      setIsPinching(true);
    } else if (event.nativeEvent.state === 5) {
      setIsPinching(false);
      
      if (baseScaleRef.current && pinchScaleRef.current) {
        const baseScale = baseScaleRef.current as any;
        const pinchScale = pinchScaleRef.current as any;
        const newScale = baseScale._value || baseScale.value || 1;
        const currentPinch = pinchScale._value || pinchScale.value || 1;
        
        // 限制缩放范围 0.5 - 3
        const clampedScale = Math.max(0.5, Math.min(3, newScale * currentPinch));
        
        Animated.timing(baseScaleRef.current, {
          toValue: clampedScale,
          duration: 100,
          useNativeDriver: true,
        }).start(() => {
          if (pinchScaleRef.current) {
            pinchScaleRef.current.setValue(1);
          }
        });
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <StatusBar style="light" hidden={false} />
      
              <Animated.View style={[styles.modalOverlay, { opacity: Platform.OS === 'web' ? 1 : (opacityRef.current ? opacityRef.current : 1) }]}>
        {/* 关闭按钮 */}
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top + 10 }]} 
          onPress={handleClose}
        >
          {Platform.OS !== 'web' ? (
            <View style={styles.blurBackground}>
              <BlurView 
                intensity={10} 
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                }}
              />
            </View>
          ) : (
            <View style={[styles.blurBackground, { backgroundColor: 'rgba(255, 255, 255, 0.4)' }]} />
          )}
          <BackIcon />
        </TouchableOpacity>

        <PinchGestureHandler
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchHandlerStateChange}
        >
          <Animated.View style={[styles.animatedContainer, Platform.OS === 'web' ? {} : {
            transform: [
              // iOS相册动画的缩放和位移
              ...(scaleRef.current && positionXRef.current && positionYRef.current ? [
                { scale: scaleRef.current },
                { translateX: positionXRef.current },
                { translateY: positionYRef.current },
              ] : []),
              // 双指缩放
              ...(baseScaleRef.current && pinchScaleRef.current ? [{ 
                scale: Animated.multiply(
                  baseScaleRef.current,
                  pinchScaleRef.current
                )
              }] : []),
              // 如果没有动画值，提供默认transform
              ...((!scaleRef.current || !positionXRef.current || !positionYRef.current) && (!baseScaleRef.current || !pinchScaleRef.current) ? [{ scale: 1 }] : [])
            ]
          }]}>
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
            >
              <Animated.View 
                style={[
                  styles.imageContainer,
                  Platform.OS === 'web' ? {} : {
                    transform: translateYRef.current ? [{ translateY: translateYRef.current }] : [{ translateY: 0 }]
                  }
                ]}
              >
                {/* 图片容器 */}
                {imageUrl && !imageError ? (
                  <AnimatedImage 
                    source={{ uri: imageUrl }} 
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                    onError={handleImageError}
                  />
                ) : imageError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>图片加载失败</Text>
                  </View>
                ) : null}
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </Modal>
  );
};