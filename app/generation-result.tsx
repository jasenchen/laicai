import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Alert, PanResponder, BackHandler, Image as RNImage } from 'react-native';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import { SvgUri } from 'react-native-svg';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppState, AppStateStatus } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  withSpring
} from 'react-native-reanimated';
import { posterGenerationService, PosterGenerationResponse } from '@/services/posterGenerationService';
import { AspectRatio, ASPECT_RATIOS } from '@/types/aspectRatio';
import { userGenerationService } from '@/services/userGenerationService';
import { fileUploadService } from '@/services/fileUploadService';
import { generationStateService } from '@/services/generationStateService';
import { useGenerationLimit } from '@/hooks/useGenerationLimit';
import * as FileSystem from 'expo-file-system';


const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <RNImage source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

const BACK_SVG = Asset.fromModule(require('../assets/UI/arrow-back.svg'));
const DOWNLOAD_SVG = Asset.fromModule(require('../assets/UI/ic-cloud-download.svg'));

// 返回按钮组件 - 使用本地图标
const BackIcon = () => (
  <SvgIcon width={18} height={18} uri={BACK_SVG.uri} />
);

// 保存按钮SVG组件 - 使用本地图标
const SaveIcon = () => (
  <SvgIcon width={20} height={20} uri={DOWNLOAD_SVG.uri} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25262a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    width: '100%',
    height: 52,
    marginTop: 0, // 状态栏高度通过useSafeAreaInsets动态设置
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 7,
    paddingVertical: 7,
    width: 32, // 增加宽度以容纳图标
    height: 32, // 增加高度以容纳图标
    backgroundColor: 'rgba(236, 239, 246, 0.4)',
    borderRadius: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 36, // 设置高度为36px
    backgroundColor: '#ffffff',
    borderRadius: 100,
    alignSelf: 'flex-start', // 宽度适应内容
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 20,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 73,
  },
  mainContentCentered: {
    justifyContent: 'center',
  },
  previewContainer: {
    width: 350,
    height: 464,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainerCompleted: {
    backgroundColor: 'transparent',
    borderRadius: 20, // 保持初始圆角20
  },
  previewImage: {
    width: '100%',
    height: '100%',
    // 移除固定圆角，通过动画控制
  },

  loadingContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  pageGeneratingLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  pageBackgroundLottie: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingLottie: {
    width: 40,
    height: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 75,
    width: 350,
  },
  thumbnailItem: {
    width: 83,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnail: {
    width: 75,
    height: 102,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  selectedThumbnailBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 83,
    height: 110,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  selectedThumbnail: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const GenerationResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets(); // 获取安全区域
  
  // 生图次数管理
  const { consumeGeneration } = useGenerationLimit();
  
  // 状态管理
  const [prompt, setPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageCount, setImageCount] = useState(1);
  const [uid, setUid] = useState('');
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [responseFormat, setResponseFormat] = useState<'url' | 'base64'>('url');
  const [streamCompleted, setStreamCompleted] = useState(false);

  // 全屏预览相关状态
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [imageLayout, setImageLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [animating, setAnimating] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isResuming, setIsResuming] = useState(false);
  
  // 动画值
  const imagePosition = useSharedValue(0);
  const maskOpacity = useSharedValue(0);
  const imageBorderRadius = useSharedValue(20);
  const translateY = useSharedValue(0);
  const imageScale = useSharedValue(1);
  
  // 处理应用状态变化的回调
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // 应用从后台回到前台
      setIsResuming(true);
      
      // 重置动画状态，确保UI正常显示
      setTimeout(() => {
        setIsResuming(false);
      }, 300);
    }
    
    setAppState(nextAppState);
  }, [appState]);
  
  // 监听应用状态变化
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [handleAppStateChange]);
  
  // 页面焦点恢复时的处理
  useEffect(() => {
    if (!isResuming && !initialized) {
      return;
    }
    
    // 简化处理逻辑，减少不必要的状态检查
  }, [isResuming, generating, initialized]);
  
  // 下滑返回的手势处理
  const gestureThreshold = 50; // 下滑阈值
  
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // 只在全屏模式下，且是向下滑动时才响应
      return isFullScreen && gestureState.dy > 5 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
    },
    onPanResponderMove: (evt, gestureState) => {
      // 限制只能向下拖拽
      if (gestureState.dy > 0) {
        // 使用阻尼函数：随着拖拽距离增加，实际移动距离增长越来越慢
        const dampenDistance = Math.sqrt(gestureState.dy) * 8; // 使用平方根函数创建阻尼效果
        translateY.value = dampenDistance;
        // 根据实际阻尼距离降低遮罩透明度，图片保持不透明
        const opacity = Math.max(0, 1 - dampenDistance / 300);
        maskOpacity.value = opacity;
        // 下滑时轻微缩小图片，最大缩小到0.7，变化更平缓
        const scale = Math.max(0.7, 1 - dampenDistance / 1000); // 使用1000作为基准，让变化更平缓
        imageScale.value = scale;
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      // 计算阻尼后的实际距离
      const dampenDistance = Math.sqrt(gestureState.dy) * 8;
      if (dampenDistance > gestureThreshold) {
        // 超过阈值，退出全屏
        handleExitFullScreen();
      } else {
        // 未超过阈值，回弹到原位
        translateY.value = withSpring(0);
        maskOpacity.value = withSpring(1);
        imageScale.value = withSpring(1);
      }
    },
    onPanResponderTerminate: () => {
      // 手势被终止时回弹
      translateY.value = withSpring(0);
      maskOpacity.value = withSpring(1);
      imageScale.value = withSpring(1);
    }
  });
  
  // 获取屏幕尺寸
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // 本地缓存图片并上传到AIPA存储
  const cacheAndUploadImages = async (imageUrls: string[], format?: 'url' | 'base64'): Promise<string[]> => {
    console.log('[GenerationResult] 开始缓存并上传图片到本地AIPA存储:', { 
      count: imageUrls.length,
      format 
    });
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        console.log(`[GenerationResult] 处理第${i + 1}张图片:`, imageUrl.substring(0, 50) + '...');
        
        try {
          let uploadedUrl: string;
          
          // 检查是否为Base64格式
          if (imageUrl.startsWith('data:image/')) {
            console.log(`[GenerationResult] 检测到Base64图片，直接上传`);
            // Base64格式直接上传
            uploadedUrl = await fileUploadService.uploadBase64Image(
              imageUrl, 
              `poster_${Date.now()}_${i}.png`
            );
          } else {
            // URL格式先下载再上传
            console.log(`[GenerationResult] 检测到URL图片，下载后上传`);
            uploadedUrl = await fileUploadService.uploadImageFromUrl(
              imageUrl, 
              `poster_${Date.now()}_${i}.png`
            );
          }
          
          uploadedUrls.push(uploadedUrl);
          console.log(`[GenerationResult] 第${i + 1}张图片上传成功`);
        } catch (error) {
          console.error(`[GenerationResult] 第${i + 1}张图片上传失败:`, error);
          // 上传失败时使用原始URL作为降级方案
          uploadedUrls.push(imageUrl);
        }
      }
      
      console.log('[GenerationResult] 所有图片处理完成:', { 
        total: imageUrls.length, 
        uploaded: uploadedUrls.length
      });
      
      return uploadedUrls;
    } catch (error) {
      console.error('[GenerationResult] 缓存并上传图片失败:', error);
      // 返回原始URL作为降级方案
      return imageUrls;
    }
  };

  // 参数解析和生成的统一处理
  useEffect(() => {
    if (initialized) {
      return; // 避免重复初始化
    }

    const initializeAndGenerate = async () => {
      try {
        const parsedPrompt = params.prompt as string || '';
        const parsedReferenceImages = params.referenceImages ? JSON.parse(params.referenceImages as string) : [];
        const parsedAspectRatio = params.aspectRatio ? JSON.parse(params.aspectRatio as string) : ASPECT_RATIOS[0];
        const parsedImageCount = params.imageCount ? parseInt(params.imageCount as string, 10) : 1;
        const parsedStreamEnabled = params.stream !== undefined ? params.stream === 'true' : true;
        const parsedResponseFormat = params.responseFormat as 'url' | 'base64' || 'url';
        const parsedIsCompleted = params.isCompleted === 'true';
        const parsedUid = params.uid as string || '';
        const parsedIsParallelGeneration = params.isParallelGeneration === 'true'; // 检查是否为并行生成模式
        
        setPrompt(parsedPrompt);
        setReferenceImages(Array.isArray(parsedReferenceImages) ? parsedReferenceImages : []);
        setAspectRatio(parsedAspectRatio);
        setImageCount(parsedImageCount);
        setStreamEnabled(parsedStreamEnabled);
        setResponseFormat(parsedResponseFormat);
        setUid(parsedUid);
        
        // 如果是已完成状态，从用户生成记录中获取实际的生成结果
        if (parsedIsCompleted) {
          setGenerating(false);
          setInitialized(true);
          
          try {
            // 从用户生成记录中获取最新的生成结果
            const generations = await userGenerationService.getUserGenerations(parsedUid, 1); // 只获取最新的1条记录
            
            if (generations.success && generations.data && generations.data.length > 0) {
              const latestGeneration = generations.data[0];
              const generatedImages = [
                latestGeneration.g_imgurl1,
                latestGeneration.g_imgurl2,
                latestGeneration.g_imgurl3,
                latestGeneration.g_imgurl4
              ].filter((url): url is string => !!url && url.trim() !== '');
              
              if (generatedImages.length > 0) {
                setGeneratedImages(generatedImages);
                try {
                  await Promise.all(generatedImages.map(url => typeof url === 'string' ? RNImage.prefetch(url) : Promise.resolve()));
                } catch {}
              } else {
                setGeneratedImages([]);
              }
            } else {
              setGeneratedImages([]);
            }
          } catch (error) {
            setGeneratedImages([]);
          }
          return;
        }
        
        
        // 如果有提示词，开始生成
        if (parsedPrompt) {
          setGenerating(true);
          setInitialized(true);
          
          // 如果是并行生成模式，直接调用4次生图API
          if (parsedIsParallelGeneration) {
            console.log('[GenerationResult] 检测到并行生成模式，开始4次并行生图');
            
            try {
              const parallelPromises = [];
              
              // 创建4个并行的生图请求
              for (let i = 0; i < 4; i++) {
                const singleRequest = posterGenerationService.generatePoster({
                  prompt: parsedPrompt,
                  referenceImages: Array.isArray(parsedReferenceImages) ? parsedReferenceImages : [],
                  aspectRatio: parsedAspectRatio,
                  style: '品质海报',
                  parallelImageCount: 1, // 每次请求生成1张图
                  responseFormat: parsedResponseFormat
                });
                
                parallelPromises.push(singleRequest);
              }
              
              // 等待所有并行请求完成
              const results = await Promise.allSettled(parallelPromises);
              
              // 提取成功生成的图片
              const generatedImages: string[] = [];
              
              results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.images.length > 0) {
                  generatedImages.push(result.value.images[0]);
                  console.log(`[GenerationResult] 第${index + 1}次生图成功`);
                } else {
                  console.error(`[GenerationResult] 第${index + 1}次生图失败:`, result.status === 'rejected' ? result.reason : '无图片生成');
                }
              });
              
              if (generatedImages.length > 0) {
                setGeneratedImages(generatedImages);
                console.log(`[GenerationResult] 并行生图完成，共生成${generatedImages.length}张图片`);
              } else {
                throw new Error('所有并行生图请求都失败了');
              }
              
              setGenerating(false);
              
              // 先标记生成为完成状态
              await generationStateService.completeGeneration();
              
              // 成功生成图片后消耗次数
              try {
                console.log('[GenerationResult] 并行生图完成，开始消耗生图次数');
                const consumeSuccess = await consumeGeneration();
                console.log('[GenerationResult] 消耗次数结果:', { consumeSuccess });
                if (!consumeSuccess) {
                  console.error('[GenerationResult] 消耗次数失败');
                  Alert.alert(
                    '提示', 
                    '消耗次数失败，但图片已生成成功',
                    [
                      {
                        text: '确定',
                        onPress: async () => {
                          try {
                            console.log('[GenerationResult] 用户确认并行消耗次数失败，清除生成状态');
                            // 清除生成状态
                            await generationStateService.clearGenerationState();
                            console.log('[GenerationResult] 并行消耗次数失败状态清除完成');
                          } catch (clearError) {
                            console.error('[GenerationResult] 清除并行消耗次数失败状态失败:', clearError);
                          }
                        },
                      },
                    ]
                  );
                } else {
                  console.log('[GenerationResult] 消耗次数成功');
                }
              } catch (error) {
                console.error('[GenerationResult] 消耗次数错误:', error);
                Alert.alert(
                  '提示', 
                  '消耗次数时发生错误，但图片已生成成功',
                  [
                    {
                      text: '确定',
                      onPress: async () => {
                        try {
                          console.log('[GenerationResult] 用户确认并行消耗次数错误，清除生成状态');
                          // 清除生成状态
                          await generationStateService.clearGenerationState();
                          console.log('[GenerationResult] 并行消耗次数错误状态清除完成');
                        } catch (clearError) {
                          console.error('[GenerationResult] 清除并行消耗次数错误状态失败:', clearError);
                        }
                      },
                    },
                  ]
                );
              }
              
              // 先缓存图片到本地，再通过AIPA上传服务上传
              const uploadedUrls = await cacheAndUploadImages(generatedImages, parsedResponseFormat);
              try {
                await Promise.all(uploadedUrls.map(url => typeof url === 'string' ? RNImage.prefetch(url) : Promise.resolve()));
              } catch {}
              
              const ref_img = Array.isArray(parsedReferenceImages) && parsedReferenceImages.length > 0 
                ? parsedReferenceImages.join('\n') 
                : undefined;
              
              const createResult = await userGenerationService.createGenerationWithResult({
                uid: parsedUid,
                prompt: parsedPrompt,
                ref_img,
                g_imgurl1: uploadedUrls[0] || '',
                g_imgurl2: uploadedUrls[1] || '',
                g_imgurl3: uploadedUrls[2] || '',
                g_imgurl4: uploadedUrls[3] || ''
              });
              
              if (createResult.success) {
                console.log('[GenerationResult] 并行生图记录创建成功');
                // 更新显示的图片为上传后的URL
                setGeneratedImages(uploadedUrls);
              } else {
                console.error('[GenerationResult] 并行生图记录创建失败:', createResult.message);
              }
              
            } catch (error) {
              console.error('[GenerationResult] 并行生图失败:', error);
              Alert.alert(
                '生成失败', 
                error instanceof Error ? error.message : '未知错误',
                [
                  {
                    text: '确定',
                    onPress: async () => {
                      try {
                        console.log('[GenerationResult] 用户确认并行生成失败，清除生成状态');
                        // 清除生成状态
                        await generationStateService.clearGenerationState();
                        // 停止生成中的任何操作
                        setGenerating(false);
                        console.log('[GenerationResult] 并行生成失败状态清除完成，返回上一页');
                        // 延迟返回，确保状态清除完成
                          router.back();
                      } catch (clearError) {
                        console.error('[GenerationResult] 清除并行生成失败状态失败:', clearError);
                        // 即使清除失败也要返回，避免用户卡住
                        setGenerating(false);
                        router.back();
                      }
                    },
                  },
                ]
              );
            }
            
            return;
          }
          
          // 初始化生成的图片数组为空
          if (parsedStreamEnabled) {
            setGeneratedImages([]);
            setStreamCompleted(false);
          }
          
          try {
            const result = await posterGenerationService.generatePoster({
              prompt: parsedPrompt,
              referenceImages: Array.isArray(parsedReferenceImages) ? parsedReferenceImages : [],
              aspectRatio: parsedAspectRatio,
              style: '品质海报',
              parallelImageCount: parsedImageCount,
              responseFormat: parsedResponseFormat
            }, {
              onStreamChunk: (chunk) => {
                handleStreamChunk(chunk, parsedImageCount, parsedPrompt, parsedUid, parsedReferenceImages);
              }
            });
            
            // 非流式模式或流式模式下的最终结果处理
            if (!parsedStreamEnabled || streamCompleted) {
              setGeneratedImages(result.images.filter((u): u is string => typeof u === 'string'));
              try {
                await Promise.all(result.images.map(url => typeof url === 'string' ? RNImage.prefetch(url) : Promise.resolve()));
              } catch {}
              setGenerating(false);
              setStreamCompleted(true);
            }
            
            // 只有在非流式模式或流式完成时才处理后续逻辑
            if (!parsedStreamEnabled || streamCompleted) {
              // 先标记生成为完成状态
              await generationStateService.completeGeneration();
              
              // 成功生成图片后消耗次数
              try {
                console.log('[GenerationResult] 非流式生图完成，开始消耗生图次数');
                const consumeSuccess = await consumeGeneration();
                console.log('[GenerationResult] 消耗次数结果:', { consumeSuccess });
                if (!consumeSuccess) {
                  console.error('[GenerationResult] 消耗次数失败');
                  Alert.alert(
                    '提示', 
                    '消耗次数失败，但图片已生成成功',
                    [
                      {
                        text: '确定',
                        onPress: async () => {
                          try {
                            console.log('[GenerationResult] 用户确认流式消耗次数失败，清除生成状态');
                            // 清除生成状态
                            await generationStateService.clearGenerationState();
                            console.log('[GenerationResult] 流式消耗次数失败状态清除完成');
                          } catch (clearError) {
                            console.error('[GenerationResult] 清除流式消耗次数失败状态失败:', clearError);
                          }
                        },
                      },
                    ]
                  );
                } else {
                  console.log('[GenerationResult] 消耗次数成功');
                }
              } catch (error) {
                console.error('[GenerationResult] 消耗次数错误:', error);
                Alert.alert(
                  '提示', 
                  '消耗次数时发生错误，但图片已生成成功',
                  [
                    {
                      text: '确定',
                      onPress: async () => {
                        try {
                          console.log('[GenerationResult] 用户确认流式消耗次数错误，清除生成状态');
                          // 清除生成状态
                          await generationStateService.clearGenerationState();
                          console.log('[GenerationResult] 流式消耗次数错误状态清除完成');
                        } catch (clearError) {
                          console.error('[GenerationResult] 清除流式消耗次数错误状态失败:', clearError);
                        }
                      },
                    },
                  ]
                );
              }
              
              // 先缓存图片到本地，再通过AIPA上传服务上传
              const uploadedUrls = await cacheAndUploadImages(result.images, parsedResponseFormat);
              try {
                await Promise.all(uploadedUrls.map(url => typeof url === 'string' ? RNImage.prefetch(url) : Promise.resolve()));
              } catch {}
              
              const ref_img = Array.isArray(parsedReferenceImages) && parsedReferenceImages.length > 0 
                ? parsedReferenceImages.join('\n') 
                : undefined;
              
              const createResult = await userGenerationService.createGenerationWithResult({
                uid: parsedUid,
                prompt: parsedPrompt,
                ref_img,
                g_imgurl1: uploadedUrls[0] || '',
                g_imgurl2: uploadedUrls[1] || '',
                g_imgurl3: uploadedUrls[2] || '',
                g_imgurl4: uploadedUrls[3] || ''
              });
              
              if (createResult.success) {
                console.log('[GenerationResult] 生图记录创建成功');
                // 更新显示的图片为上传后的URL
                setGeneratedImages(uploadedUrls);
              } else {
                console.error('[GenerationResult] 生图记录创建失败:', createResult.message);
              }
            }
          } catch (error) {
            console.error('[GenerationResult] 生成失败:', error);
            Alert.alert(
              '生成失败', 
              error instanceof Error ? error.message : '未知错误',
              [
                {
                  text: '确定',
                  onPress: async () => {
                    try {
                      console.log('[GenerationResult] 用户确认生成失败，清除生成状态');
                      // 清除生成状态
                      await generationStateService.clearGenerationState();
                      // 停止生成中的任何操作
                      setGenerating(false);
                      console.log('[GenerationResult] 生成失败状态清除完成，返回上一页');
                      // 延迟返回，确保状态清除完成
                      router.back();
                    } catch (clearError) {
                      console.error('[GenerationResult] 清除生成失败状态失败:', clearError);
                      // 即使清除失败也要返回，避免用户卡住
                      setGenerating(false);
                      router.back();
                    }
                  },
                },
              ]
            );
          } finally {
            if (!parsedStreamEnabled) {
              setGenerating(false);
            }
          }
        } else {
          setInitialized(true);
        }
      } catch (error) {
        console.error('[GenerationResult] 参数解析失败:', error);
        Alert.alert(
          '参数错误', 
          '页面参数解析失败，请重新生成',
          [
            {
              text: '确定',
              onPress: async () => {
                try {
                  console.log('[GenerationResult] 用户确认参数错误，清除生成状态');
                  // 清除生成状态
                  await generationStateService.clearGenerationState();
                  // 停止生成中的任何操作
                  setGenerating(false);
                  console.log('[GenerationResult] 参数错误状态清除完成，返回上一页');
                  // 延迟返回，确保状态清除完成
                  router.back();
                } catch (clearError) {
                  console.error('[GenerationResult] 清除参数错误状态失败:', clearError);
                  // 即使清除失败也要返回，避免用户卡住
                  setGenerating(false);
                  router.back();
                }
              },
            },
          ]
        );
        setInitialized(true); // 标记为已初始化，防止重复错误
      }
    };

    initializeAndGenerate();
  }, [params, initialized, router]);

  // 处理流式生成完成后的逻辑
  const handleStreamCompletion = useCallback(async (
    finalChunk: any,
    prompt: string,
    uid: string,
    referenceImages: string[]
  ) => {
    console.log('[GenerationResult] 处理流式生成完成逻辑');
    
    try {
      // 成功生成图片后消耗次数
      console.log('[GenerationResult] 流式生图完成，开始消耗生图次数');
      const consumeSuccess = await consumeGeneration();
      console.log('[GenerationResult] 消耗次数结果:', { consumeSuccess });
      if (!consumeSuccess) {
        console.error('[GenerationResult] 消耗次数失败');
        Alert.alert(
          '提示', 
          '消耗次数失败，但图片已生成成功',
          [
            {
              text: '确定',
              onPress: async () => {
                try {
                  console.log('[GenerationResult] 用户确认消耗次数失败，清除生成状态');
                  // 清除生成状态
                  await generationStateService.clearGenerationState();
                  console.log('[GenerationResult] 消耗次数失败状态清除完成');
                } catch (clearError) {
                  console.error('[GenerationResult] 清除消耗次数失败状态失败:', clearError);
                }
              },
            },
          ]
        );
      } else {
        console.log('[GenerationResult] 消耗次数成功');
      }
      
      // 先缓存图片到本地，再通过AIPA上传服务上传
      const finalImages = finalChunk?.data?.map((item: any) => item.url).filter((url: string) => url) || [];
      
      if (uid && finalImages.length > 0) {
        try {
          console.log('[GenerationResult] 流式完成，开始上传生图图片到AIPA存储');
          const uploadedUrls = await cacheAndUploadImages(finalImages, responseFormat);
          
          const ref_img = Array.isArray(referenceImages) && referenceImages.length > 0 
            ? referenceImages.join('\n') 
            : undefined;
          
          const createResult = await userGenerationService.createGenerationWithResult({
            uid,
            prompt,
            ref_img,
            g_imgurl1: uploadedUrls[0] || '',
            g_imgurl2: uploadedUrls[1] || '',
            g_imgurl3: uploadedUrls[2] || '',
            g_imgurl4: uploadedUrls[3] || ''
          });
          
          if (createResult.success) {
            console.log('[GenerationResult] 流式生图记录创建成功');
            // 更新显示的图片为上传后的URL
            setGeneratedImages(uploadedUrls);
          } else {
            console.error('[GenerationResult] 流式生图记录创建失败:', createResult.message);
          }
        } catch (error) {
          console.error('[GenerationResult] 流式生图图片上传失败:', error);
          // 上传失败时仍显示原始图片
        }
      }
    } catch (error) {
      console.error('[GenerationResult] 流式完成处理失败:', error);
    }
  }, [consumeGeneration, responseFormat, cacheAndUploadImages, userGenerationService]); // 添加所有依赖

  // 专门处理流式数据块的函数
  const handleStreamChunk = useCallback((chunk: any, parsedImageCount: number, parsedPrompt: string, parsedUid: string, parsedReferenceImages: string[]) => {
    console.log('[GenerationResult] 流式数据块:', chunk);
    
    // 处理流式数据块
    if (chunk && chunk.data && chunk.data.length > 0) {
      // 提取新图片的URL
      const newImageUrls = chunk.data
        .filter((item: { url?: string }) => item.url && item.url !== '')
        .map((item: { url?: string }) => item.url!);
      
      if (newImageUrls.length > 0) {
        console.log('[GenerationResult] 发现新图片:', newImageUrls);
        
        // 逐张添加图片，不替换已存在的图片
        setGeneratedImages(prev => {
          const existingUrls = new Set(prev);
          const uniqueNewUrls = (newImageUrls as string[]).filter((url: string) => !existingUrls.has(url));
          const result = [...prev, ...uniqueNewUrls];
          console.log('[GenerationResult] 更新图片列表:', { 
            before: prev.length, 
            new: uniqueNewUrls.length, 
            after: result.length 
          });
          return result;
        });
        
        // 如果这是第一张图片，自动选中它
        setSelectedImageIndex(prev => {
          const shouldSelect = prev === 0 && newImageUrls.length > 0;
          if (shouldSelect) {
            console.log('[GenerationResult] 自动选中第一张图片');
            return 0;
          }
          return prev;
        });
        
        // 每次有新图片时都震动一下，提升用户体验
        if (Platform.OS !== 'web') {
          try {
            // 这里可以添加震动反馈，但需要import expo-haptics
            // await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {
            // 忽略震动错误
          }
        }
      }
      
      // 检查是否完成所有图片生成
      if (chunk.data.length >= parsedImageCount) {
        console.log('[GenerationResult] 流式生成完成，共生成', chunk.data.length, '张图片');
        setStreamCompleted(true);
        setGenerating(false);
        
        // 立即标记生成状态为完成，确保海报生成页能及时检测到
        generationStateService.completeGeneration().then(() => {
          console.log('[GenerationResult] 流式生成状态标记完成');
        }).catch(error => {
          console.error('[GenerationResult] 标记流式生成状态完成失败:', error);
        });
        
        // 流式完成后执行后续逻辑
        handleStreamCompletion(chunk, parsedPrompt, parsedUid, parsedReferenceImages);
      }
    }
  }, [handleStreamCompletion]); // 添加handleStreamCompletion依赖

  // 图片尺寸检测
  const handleImageLoad = useCallback((event: any) => {
    try {
      // Web环境下的兼容性处理
      let width: number, height: number;
      
      if (Platform.OS === 'web') {
        // Web环境下，事件对象可能包含序列化问题，直接访问原生属性
        const target = (event as any).target || (event as any).nativeEvent?.target;
        if (target && target.naturalWidth && target.naturalHeight) {
          width = target.naturalWidth;
          height = target.naturalHeight;
        } else {
          console.warn('[GenerationResult] Web环境下无法获取图片尺寸');
          return;
        }
      } else {
        // 移动端环境下使用原有逻辑
        if (event.nativeEvent && event.nativeEvent.source) {
          width = event.nativeEvent.source.width;
          height = event.nativeEvent.source.height;
        } else if (event.nativeEvent && event.nativeEvent.width) {
          width = event.nativeEvent.width;
          height = event.nativeEvent.height;
        } else {
          console.warn('[GenerationResult] 移动端环境下无法获取图片尺寸');
          return;
        }
      }
      
      if (width && height) {
        console.log('[GenerationResult] 图片尺寸:', { width, height });
        setImageDimensions({ width, height });
      } else {
        console.warn('[GenerationResult] 获取到无效的图片尺寸');
      }
    } catch (error) {
      console.warn('[GenerationResult] 图片尺寸检测失败:', error instanceof Error ? error.message : error);
    }
  }, []);

  // 根据图片比例动态计算容器尺寸
  const previewContainerStyle = useMemo(() => {
    const defaultWidth = 350;
    const defaultHeight = 464;

    if (generating || !imageDimensions) {
      // 默认状态或图片尺寸未知时使用默认尺寸
      return {
        width: defaultWidth,
        height: defaultHeight,
      };
    }

    const { width: imgWidth, height: imgHeight } = imageDimensions;
    const aspectRatio = imgWidth / imgHeight;

    console.log('[GenerationResult] 图片比例:', { aspectRatio, imgWidth, imgHeight });

    if (aspectRatio > 1) {
      // 横向图片或正方形图片：宽度默认，高度适应
      return {
        width: defaultWidth,
        height: defaultWidth / aspectRatio,
        maxWidth: defaultWidth,
      };
    } else {
      // 纵向图片：高度默认，宽度适应
      return {
        width: defaultHeight * aspectRatio,
        height: defaultHeight,
        maxHeight: defaultHeight,
      };
    }
  }, [generating, imageDimensions]);

  // 预览图片的优化渲染 - 使用useMemo避免重复渲染
  const previewImage = useMemo(() => {
    if (generating) return null;
    if (generatedImages.length > 0 && selectedImageIndex < generatedImages.length) {
      const imageUrl = generatedImages[selectedImageIndex];
      
      // 检查是否为Base64格式
      if (imageUrl.startsWith('data:image/')) {
        console.log('[GenerationResult] 渲染Base64图片');
        return { uri: imageUrl, isBase64: true };
      } else {
        console.log('[GenerationResult] 渲染URL图片');
        return { uri: imageUrl, isBase64: false };
      }
    }
    return null;
  }, [generating, generatedImages, selectedImageIndex]);

  // 处理左上角按钮返回（需要清除状态）
  const handleBackButtonPress = () => {
    if (generating) {
      Alert.alert(
        '确认退出',
        '正在生成中，确定要退出吗？',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '确定',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('[GenerationResult] 用户确认退出，清除生成状态');
                // 先清除生成状态
                await generationStateService.clearGenerationState();
                // 停止生成中的任何操作
                setGenerating(false);
                console.log('[GenerationResult] 状态清除完成，返回上一页');
                // 延迟返回，确保状态清除完成
                router.back();
              } catch (error) {
                console.error('[GenerationResult] 清除生成状态失败:', error);
                // 即使清除失败也要返回，避免用户卡住
                setGenerating(false);
                router.back();
              }
            },
          },
        ]
      );
    } else {
      generationStateService.clearGenerationState().catch(() => {});
      router.back();
    }
  };

  // 处理系统手势返回（保留状态）
  const handleSystemBack = () => {
    router.back();
  };

  // 系统返回按钮处理（Android）
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (generating) {
        // Android硬件返回键时保留状态，不弹出确认框
        handleSystemBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [generating]);

  // 焦点效果处理（区分系统手势和按钮返回）
  useFocusEffect(
    useCallback(() => {
      // 页面获得焦点时不执行任何操作，保持当前状态
      return () => {
        // 页面失去焦点时不执行任何操作，保持状态
      };
    }, [])
  );

  // 处理图片点击，进入全屏预览
  const handlePreviewImagePress = () => {
    if (previewImage && previewImage.uri && imageLayout && !generating && !animating && !isResuming) {
      setAnimating(true);
      setIsFullScreen(true);
      // 开始动画
      imagePosition.value = withTiming(1, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(setAnimating)(false);
        }
      });
      // 遮罩渐显动画
      maskOpacity.value = withTiming(1, { duration: 400 });
      // 圆角动画从20到0
      imageBorderRadius.value = withTiming(0, { duration: 400 });
      return true;
    }
    return false;
  };
  
  // 退出全屏预览
  const handleExitFullScreen = () => {
    if (animating) return;
    setAnimating(true);
    // 重置下滑相关的动画值
    translateY.value = withSpring(0);
    imageScale.value = withSpring(1);
    // 开始退出动画
    imagePosition.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(setIsFullScreen)(false);
        runOnJS(setAnimating)(false);
      }
    });
    // 遮罩渐隐动画
    maskOpacity.value = withTiming(0, { duration: 300 });
    // 圆角动画从0回到20
    imageBorderRadius.value = withTiming(20, { duration: 300 });
  };
  
  // 处理图片布局信息获取
  const handleImageLayout = useCallback((event: any) => {
    if (isResuming) return; // 恢复状态时不重新计算布局
    
    const { layout } = event.nativeEvent;
    setImageLayout({
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height
    });
  }, [isResuming]);
  
  // 图片动画样式
  const animatedImageStyle = useAnimatedStyle(() => {
    if (!imageLayout) {
      return {};
    }
    
    const progress = imagePosition.value;
    
    // 计算屏幕可用区域（排除状态栏）
    const availableHeight = screenHeight - insets.top;
    const availableWidth = screenWidth;
    
    // 计算图片初始中心位置
    const initialCenterX = imageLayout.x + imageLayout.width / 2;
    const initialCenterY = imageLayout.y + imageLayout.height / 2;
    
    // 计算目标中心位置（屏幕中心，考虑状态栏偏移）
    const targetCenterX = availableWidth / 2;
    const targetCenterY = (availableHeight / 2) - (insets.top / 2); // 向上偏移状态栏高度的一半
    
    // 计算缩放比例，确保图片完整显示（使用contain模式）
    const scaleX = availableWidth / imageLayout.width;
    const scaleY = availableHeight / imageLayout.height;
    const scale = Math.min(scaleX, scaleY) * 1; // 使用min确保完整显示，完全填满屏幕
    
    // 计算位移
    const translateX = (targetCenterX - initialCenterX) * progress;
    const baseTranslateY = (targetCenterY - initialCenterY) * progress;
    
    return {
      transform: [
        { translateX },
        { translateY: baseTranslateY + translateY.value },
        { scale: (1 + (scale - 1) * progress) * imageScale.value }
      ],
      zIndex: progress > 0 ? 1000 : 1,
    } as any;
  });
  
  // 遮罩动画样式
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: maskOpacity.value,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
    };
  });

  // 图片圆角动画样式
  const animatedImageBorderStyle = useAnimatedStyle(() => {
    return {
      borderRadius: imageBorderRadius.value,
    };
  });

  // 父容器圆角动画样式
  const animatedContainerBorderStyle = useAnimatedStyle(() => {
    return {
      borderRadius: imageBorderRadius.value,
    };
  });

  const handleSavePress = async () => {
    if (generatedImages.length === 0 || selectedImageIndex >= generatedImages.length || isResuming) {
      console.error('[GenerationResult] 没有可保存的图片');
      Alert.alert(
        '保存失败', 
        '没有可保存的图片',
        [
          {
            text: '确定',
            onPress: async () => {
              try {
                console.log('[GenerationResult] 用户确认没有可保存的图片，清除生成状态');
                // 清除生成状态
                await generationStateService.clearGenerationState();
                console.log('[GenerationResult] 没有可保存图片状态清除完成，返回上一页');
                // 延迟返回，确保状态清除完成
                router.back();
              } catch (clearError) {
                console.error('[GenerationResult] 清除没有可保存图片状态失败:', clearError);
                // 即使清除失败也要返回，避免用户卡住
                router.back();
              }
            },
          },
        ]
      );
      return;
    }

    try {
      setSaving(true);
      
      // 获取当前选中的图片URL
      const downloadImageUrl = generatedImages[selectedImageIndex];
      console.log('[GenerationResult] 准备保存图片:', { 
        uid, 
        imageUrl: downloadImageUrl,
        imageIndex: selectedImageIndex 
      });
      
      // 验证图片URL
      if (!downloadImageUrl || typeof downloadImageUrl !== 'string') {
        throw new Error('图片URL无效');
      }
      
      // 检查URL格式
      if (!downloadImageUrl.startsWith('http://') && !downloadImageUrl.startsWith('https://')) {
        throw new Error('图片URL格式不正确');
      }
      
      // 更新数据库中的下载记录
      if (uid && downloadImageUrl) {
        try {
          console.log('[GenerationResult] 更新下载记录:', { uid, downloadImageUrl });
          await userGenerationService.updateDownloadRecord(uid, downloadImageUrl);
          console.log('[GenerationResult] 下载记录更新成功');
        } catch (error) {
          console.error('[GenerationResult] 下载记录更新失败:', error);
          // 不影响正常的保存功能
        }
      }
      
      console.log('[GenerationResult] 开始保存海报到相册:', downloadImageUrl);
      await posterGenerationService.savePoster(downloadImageUrl);
      console.log('[GenerationResult] 海报保存成功');
      
      Alert.alert('保存成功', '海报已保存到相册');
    } catch (error) {
      console.error('[GenerationResult] 保存失败:', error);
      
      // 提供更友好的错误提示
      let errorMessage = '保存失败';
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('无法下载')) {
          errorMessage = '图片无法下载，请检查网络连接或稍后重试';
        } else if (error.message.includes('权限')) {
          errorMessage = '需要相册权限才能保存图片，请在设置中允许访问相册';
        } else if (error.message.includes('超时')) {
          errorMessage = '保存超时，请检查网络连接后重试';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        '保存失败', 
        errorMessage,
        [
          {
            text: '确定',
            onPress: async () => {
              await generationStateService.clearGenerationState().catch(() => {});
              router.back();
            },
          },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailPress = (index: number) => {
    if (!generating && !animating && !isResuming) {
      setSelectedImageIndex(index);
      // 切换图片时保持当前容器尺寸，不再重新计算
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header - 始终存在且最高层级，全屏时也可操作 */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            marginTop: insets.top,
            zIndex: 1002 // 最高层级
          }
        ]}
        pointerEvents={isFullScreen ? 'auto' : 'auto'} // 全屏时也可操作
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (isFullScreen) {
              // 全屏模式下点击返回按钮退出全屏
              handleExitFullScreen();
            } else {
              // 非全屏模式下点击返回按钮，使用按钮返回逻辑（清除状态）
              handleBackButtonPress();
            }
          }}
        >
          <BackIcon />
        </TouchableOpacity>
        
        {/* 保存按钮 */}
        {generatedImages.length > 0 && !generating && !isResuming && (
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSavePress} 
            disabled={saving || generating || animating} // 全屏时依然可用
          >
            <SaveIcon />
            <Text style={styles.saveButtonText}>{saving ? '保存中' : '保存'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* 主内容区域 - 始终占据整个空间 */}
      <View style={[
        styles.mainContent,
        generating && styles.mainContentCentered
      ]}>
        {/* 预览区域 - 可动画的图片容器 */}
        <Animated.View 
          style={[
            styles.previewContainer,
            !generating && styles.previewContainerCompleted,
            previewContainerStyle,
            animatedImageStyle,
            animatedContainerBorderStyle
          ]}
          onLayout={handleImageLayout}
          onStartShouldSetResponder={handlePreviewImagePress}
        >
          {generating ? (
            <View style={styles.loadingContainer}>
                <LottieView
                  source={require('../assets/lottie/ai-loading-white.json')}
                  autoPlay
                  loop
                  style={styles.loadingLottie}
                />
              <Text style={styles.loadingText}>生成中...</Text>
            </View>
          ) : (
            generatedImages.length > 0 ? (
              <View style={{ width: '100%', height: '100%' }}>
                {Array.from({ length: imageCount }).map((_, index) => {
                  const uri = generatedImages[index];
                  const isSelected = selectedImageIndex === index;
                  return (
                    <ExpoImage
                      key={index}
                      source={uri ? { uri } : undefined}
                      style={[
                        styles.previewImage,
                        animatedImageBorderStyle,
                        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: isSelected ? 1 : 0 }
                      ]}
                      contentFit="contain"
                      cachePolicy="disk"
                      transition={200}
                      onLoad={isSelected ? handleImageLoad : undefined}
                    />
                  );
                })}
              </View>
            ) : null
          )}
        </Animated.View>
        
        {/* 缩略图容器 - 只在非生成中且有图片时显示 */}
        {!generating && !isResuming && (
          <View style={styles.thumbnailContainer}>
            {/* 显示实际生图数量的缩略图 */}
            {Array.from({ length: imageCount }).map((_, index) => (
              <TouchableOpacity
                key={index}
                style={styles.thumbnailItem}
                onPress={() => !generating && !animating && !isResuming && handleThumbnailPress(index)}
                disabled={generating || animating || isFullScreen}
              >
                {selectedImageIndex === index && (
                  <View style={styles.selectedThumbnailBorder} />
                )}
                {generatedImages.length > index ? (
                  <ExpoImage
                    source={{ uri: generatedImages[index] }}
                    style={[
                      styles.thumbnail,
                      selectedImageIndex === index && styles.selectedThumbnail
                    ]}
                    contentFit="cover"
                    cachePolicy="disk"
                    transition={150}
                  />
                ) : (
                  // 未生成的空白占位符
                  <View style={styles.thumbnail} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {generating && (
        <View style={styles.pageGeneratingLayer} pointerEvents="none">
          <LottieView
            source={require('../assets/lottie/ai-thinking-1680h.json')}
            autoPlay
            loop
            style={styles.pageBackgroundLottie}
          />
          <BlurView intensity={200} tint="dark" style={StyleSheet.absoluteFillObject} />
        </View>
      )}

      {/* 全屏遮罩层 - 遮盖页面内容 */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFillObject, 
          overlayAnimatedStyle,
          { zIndex: 999 }
        ]}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleExitFullScreen}
        pointerEvents={isFullScreen ? 'auto' : 'none'}
      />

      {/* 下滑返回手势区域 - 只在全屏模式下显示 */}
      {isFullScreen && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              zIndex: 1001, // 在遮罩层之上，但在header之下
              backgroundColor: 'transparent',
            }
          ]}
          {...panResponder.panHandlers}
          pointerEvents="auto"
        />
      )}
      


    </View>
  );
};

export default GenerationResultScreen;
