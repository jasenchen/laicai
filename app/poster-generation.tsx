import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Image, Platform, StatusBar, Keyboard, Animated, Dimensions } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFileUpload } from '@/hooks/useFileUpload';
import { uploadFromUri } from '@/services/uploadService';
import { Colors } from '@/constants/Colors';
import { useGenerationLimit } from '@/hooks/useGenerationLimit';
import { PosterGenerationHeader } from '@/components/poster-generation/PosterGenerationHeader';
import { StyleTabSelector } from '@/components/poster-generation/StyleTabSelector';
import { ReferenceImageUploadWithDefault } from '@/components/poster-generation/ReferenceImageUpload';
import { PromptInput } from '@/components/poster-generation/PromptInput';
import { GenerationToolbar } from '@/components/poster-generation/GenerationToolbar';
import { MoreOptionsModal } from '@/components/poster-generation/MoreOptionsModal';
import { ASPECT_RATIOS, AspectRatio } from '@/types/aspectRatio';
import { userGenerationService } from '@/services/userGenerationService';
import { generationStateService, GenerationState } from '@/services/generationStateService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF3F7',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
    position: 'relative',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  fixedHeader: {
    zIndex: 2,
    height: 52,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 32,
  },
  titleSection: {
    marginTop: 32,
    paddingLeft: 25,
    marginBottom: 68,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 19,
  },
  subtitleContainer: {
    width: 156,
  },
  subtitleImage: {
    width: 156,
    height: 20,
    resizeMode: 'contain',
  },
  titleContainer: {
    width: 273,
  },
  titleImage: {
    width: 273,
    height: 30,
    resizeMode: 'contain',
  },
  tabSection: {
    marginLeft: 20,
    marginBottom: 8,
  },
  bottomPanel: {
    backgroundColor: 'rgba(46, 46, 50, 0.78)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.49,
    shadowRadius: 58.2,
    elevation: 10,
    zIndex: 2,
  },
});

// 定义tab配置的类型
interface TabConfig {
  referenceImages: string[]; // 页面显示的默认参考图
  systemReferenceImage: string | null; // 系统默认参考图（不显示在页面上）
  prompt?: string;
  promptTemplate?: string;
  inputPlaceholder?: string; // 输入框占位符
}

const SUPA_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPA_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const TAB_CONFIGS: Record<string, TabConfig> = {};

export default function PosterGenerationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // 获取从首页传递的拍照图片参数
  const capturedImage = typeof params.capturedImage === 'string' ? params.capturedImage : null;
  const fromHomeCamera = params.fromHomeCamera === 'true';
  const needsUpload = params.needsUpload === 'true'; // 是否需要上传的标识
  
  // 获取状态栏高度，Web端返回0
  const statusBarHeight = Platform.OS === 'web' ? 0 : insets.top;
  
  // 键盘高度状态
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardAnimation = useRef(new Animated.Value(0)).current;
  const titleOpacityAnimation = useRef(new Animated.Value(1)).current;
  
  // 应用状态管理
  const [appState, setAppState] = useState(AppState.currentState);
  const [isResuming, setIsResuming] = useState(false);
  
  // bottomPanel 相关状态
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number | null>(null);
  const [isBottomPanelMeasured, setIsBottomPanelMeasured] = useState(false);
  const [isPageStable, setIsPageStable] = useState(false);
  const bottomPanelRef = useRef<View>(null);
  const measureTimeoutRef = useRef<number | null>(null);
  
  const [selectedStyle, setSelectedStyle] = useState('趣味图文');
  const [referenceImages, setReferenceImages] = useState<string[]>([]); // 初始化为空数组
  const [tabsLoading, setTabsLoading] = useState(true);
  const [dishName, setDishName] = useState(''); // 菜品名变量，默认为空
  const [aspectRatio, setAspectRatio] = useState('3:4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [imageCount, setImageCount] = useState(1);
  const [parallelImageCount, setParallelImageCount] = useState(4);
  const [responseFormat, setResponseFormat] = useState<'url' | 'base64'>('url'); // 返回格式默认为url
  const [hasActiveGeneration, setHasActiveGeneration] = useState(false);
  const [hasCompletedGeneration, setHasCompletedGeneration] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [subtitleSvgUri, setSubtitleSvgUri] = useState<string | null>(null);
  const [titleSvgUri, setTitleSvgUri] = useState<string | null>(null);
  // 生成次数管理
  const { remainingCount, consumeGeneration, resetRemainingCount, getRemainingCount } = useGenerationLimit();
  useEffect(() => {
    try {
      const sub = Asset.fromModule(require('../assets/UI/subtitle.svg'));
      setSubtitleSvgUri(sub.uri);
    } catch {}
    try {
      const ttl = Asset.fromModule(require('../assets/UI/img-title.svg'));
      setTitleSvgUri(ttl.uri);
    } catch {}
  }, []);

  // 状态管理 - 统一管理上传和替换状态
  const [globalUploadStatus, setGlobalUploadStatus] = useState<'idle' | 'selecting' | 'uploading' | 'success' | 'error'>('idle');
  const [globalUploadProgress, setGlobalUploadProgress] = useState(0);
  const [replacingIndex, setReplacingIndex] = useState<number | undefined>();
  const [capturedImageProcessed, setCapturedImageProcessed] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null); // 存储本地图片URL
  const [capturedImageUploadedUrl, setCapturedImageUploadedUrl] = useState<string | null>(null); // 存储上传后的URL
  
  // 跟踪每个tab的用户删除状态
  const [tabDeletedStates, setTabDeletedStates] = useState<Record<string, boolean>>({});
  
  // 使用焦点效果确保页面显示时状态正确
  const [isCheckingState, setIsCheckingState] = useState(false);
  // 跟踪是否是从结果页返回
  const [isReturningFromResult, setIsReturningFromResult] = useState(false);
  // 跟踪是否是首次进入页面
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  useFocusEffect(
    useCallback(() => {
      // 防止重复检查的标志
      if (isCheckingState) {
        return;
      }
      
      const checkState = async () => {
        try {
          setIsCheckingState(true);
          
          // 只在以下场景下检查焦点状态：
          // 1. 首次进入页面
          // 2. 从生成结果页返回
          if (!isFirstLoad && !isReturningFromResult) {
            console.log('[PosterGeneration] 非首次进入且非从结果页返回，跳过状态检查');
            return;
          }
          
          console.log('[PosterGeneration] 场景检查:', { isFirstLoad, isReturningFromResult });
          console.log('[PosterGeneration] 页面获得焦点，重新检查可用次数');
          
          const count = await getRemainingCount();
          console.log('[PosterGeneration] 获取到的可用次数:', count);
          
          const hasActive = await generationStateService.hasActiveGeneration();
          const hasCompleted = await generationStateService.hasCompletedGeneration();
          const state = await generationStateService.getGenerationState();
          
          // 更新状态
          setHasActiveGeneration(hasActive);
          setHasCompletedGeneration(hasCompleted);
          setGenerationState(state);
          
          // 重置场景标志
          if (isFirstLoad) {
            setIsFirstLoad(false);
          }
          if (isReturningFromResult) {
            setIsReturningFromResult(false);
          }
          
          // 如果有已完成的生成，立即跳转到结果页
          if (hasCompleted && state && !isCheckingState) {
            // 跳转后立即清除状态，防止重复跳转
            await generationStateService.clearGenerationState();
            
            // 使用较短延迟，确保状态更新完成
            const jumpTimeout = setTimeout(() => {
              router.push({
                pathname: '/generation-result',
                params: {
                  prompt: state.prompt,
                  referenceImages: JSON.stringify(state.referenceImages),
                  aspectRatio: JSON.stringify(ASPECT_RATIOS.find(ar => ar.name === state.aspectRatio) || ASPECT_RATIOS[0]),
                  imageCount: state.imageCount.toString(),
                  stream: state.streamEnabled.toString(),
                  responseFormat: state.responseFormat,
                  uid: state.uid,
                  // 明确指示这是已完成状态，不是重新生成
                  isCompleted: 'true'
                }
              });
            }, 100); // 减少延迟时间到100ms
            
            // 清理函数，防止组件卸载后仍然跳转
            return () => clearTimeout(jumpTimeout);
          }
        } catch (error) {
          // 只输出错误，不输出正常状态检查
        } finally {
          setIsCheckingState(false);
        }
      };
      
      // 立即检查，不延迟
      checkState();
    }, [router, isCheckingState, getRemainingCount, isFirstLoad, isReturningFromResult])
  );

  // 移除重复的定期状态检查，避免与useFocusEffect冲突
  // 改为仅依赖useFocusEffect进行状态检查
  useEffect(() => {
    // 不再设置定期检查，避免与焦点效果冲突和日志过多
  }, []);

  // 监听应用状态变化的回调
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // 应用从后台回到前台时重新检查生成状态
      setTimeout(() => {
        generationStateService.getGenerationState().then(state => {
          if (state) {
            setHasActiveGeneration(state.isGenerating);
            setHasCompletedGeneration(state.isCompleted);
            setGenerationState(state);
          } else {
            // 如果没有状态，确保所有状态都被重置
            setHasActiveGeneration(false);
            setHasCompletedGeneration(false);
            setGenerationState(null);
          }
        }).catch(() => {
          // 静默处理错误，避免日志过多
        });
      }, 500);
      
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
  
  // 根据tab和菜品名生成最终提示词
  const generatePrompt = useCallback((styleName: string, dishNameValue: string) => {
    const config = TAB_CONFIGS[styleName];
    if (!config) return '';
    
    // 如果有提示词模板（如品质海报、趣味图文、招牌特写），则进行拼接
    if (config.promptTemplate) {
      if (styleName === '趣味图文' || styleName === '招牌特写') {
        // 趣味图文和招牌特写的拼接文本逻辑
        const replacementText = dishNameValue.trim() 
          ? `"${dishNameValue}"作为主标题，根据图2的菜品主体进行联想并更改副标题文案，保证文案准确性，无语病无错字` 
          : '根据图2的菜品主体进行联想并更改文案（包括主标题和副标题文案），保证文案准确性，无语病无错字';
        
        return config.promptTemplate.replace('{拼接文本}', replacementText);
      } else {
        // 其他tab的拼接逻辑（如品质海报）
        const replacementText = dishNameValue.trim() 
          ? `将右侧白框里的小子替换为"${dishNameValue}"` 
          : '识别图二的食物主体，并替换为右侧白框里的小字';
        
        return config.promptTemplate.replace('{dynamicContent}', replacementText);
      }
    }
    
    // 否则直接返回固定的提示词
    return config.prompt || '';
  }, []);

  // 页面渲染完成后测量 bottomPanel 初始高度
  const measureBottomPanel = useCallback(() => {
    // 确保页面完全稳定且组件已渲染
    if (!bottomPanelRef.current || isBottomPanelMeasured || !isPageStable) {
      return;
    }

    // 使用requestAnimationFrame确保在下一帧测量
    requestAnimationFrame(() => {
      if (!bottomPanelRef.current || isBottomPanelMeasured || !isPageStable) {
        return;
      }
      
      // 再次延迟，确保布局完全稳定
      setTimeout(() => {
        if (!bottomPanelRef.current || isBottomPanelMeasured || !isPageStable) {
          return;
        }
        
        bottomPanelRef.current.measure((fx, fy, width, height, px, py) => {
          if (height > 0 && !isBottomPanelMeasured && isPageStable) {
            console.log('[PosterGeneration] bottomPanel 测量完成:', { 
              测量高度: height,
              fx,
              fy,
              width,
              px,
              py
            });
            // 直接使用测量到的高度，不再减去padding
            const measuredHeight = height;
            console.log('[PosterGeneration] 使用测量高度:', measuredHeight);
            setBottomPanelHeight(measuredHeight);
            setIsBottomPanelMeasured(true);
          }
        });
      }, 200); // 额外200ms延迟确保布局稳定
    });
  }, [isBottomPanelMeasured, isPageStable]);
  
  // 页面稳定性检查和高度测量 - 防止在应用切换时重复测量
  useEffect(() => {
    // 如果正在恢复状态，不执行测量
    if (isResuming) {
      return;
    }
    
    // 先标记页面稳定
    setIsPageStable(true);
    
    // 清除之前的定时器
    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
    }
    
    // 多次检查确保页面完全稳定
    let checkCount = 0;
    const maxChecks = 3; // 减少检查次数
    
    const checkStability = () => {
      checkCount++;
      
      // 执行测量
      measureBottomPanel();
      
      // 如果还没测量成功且还有检查次数，继续检查
      if (!isBottomPanelMeasured && checkCount < maxChecks) {
        measureTimeoutRef.current = setTimeout(checkStability, 1000) as unknown as number;
      }
    };
    
    // 延迟执行首次检查，确保所有组件渲染完成
    measureTimeoutRef.current = setTimeout(checkStability, 2000) as unknown as number;

    return () => {
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current);
      }
    };
  }, [measureBottomPanel, isBottomPanelMeasured, isResuming]);

  // 统一的参考图管理逻辑 - 增强版本，支持用户修改后的tab切换保留
  useLayoutEffect(() => {
    if (tabsLoading) {
      return;
    }
    console.log('[PosterGeneration] 参考图初始化检查:', {
      fromHomeCamera,
      needsUpload,
      hasCapturedImage: !!capturedImage,
      capturedImageProcessed,
      currentImages: referenceImages.length,
      selectedStyle
    });
    
    // 如果是从首页拍照跳转且有图片且未处理过
    if (fromHomeCamera && capturedImage && !capturedImageProcessed) {
      console.log('[PosterGeneration] 拍照模式：设置本地图片，准备上传:', capturedImage);
      
      // 设置本地图片URL和上传状态
      setLocalImageUrl(capturedImage);
      setReferenceImages([capturedImage]); // 先显示本地图片
      setCapturedImageProcessed(true);
      
      // 如果需要上传，则启动上传过程
      if (needsUpload) {
        console.log('[PosterGeneration] 开始上传本地图片:', capturedImage);
        setGlobalUploadStatus('uploading');
        setGlobalUploadProgress(0);
        
        uploadFromUri(
          capturedImage,
          `photo_${Date.now()}.jpg`,
          'image/jpeg',
          {
            maxSize: 10 * 1024 * 1024,
            allowedTypes: ['image/*'],
            maxFiles: 1,
            onSuccess: (files) => {
              if (files.length > 0) {
                const uploadedUrl = files[0].url;
                console.log('[PosterGeneration] 拍照图片上传成功:', uploadedUrl);
                setCapturedImageUploadedUrl(uploadedUrl);
                setReferenceImages([uploadedUrl]); // 替换为上传后的URL
                setGlobalUploadStatus('success');
                setGlobalUploadProgress(100);
              }
            },
            onError: (error) => {
              console.error('[PosterGeneration] 拍照图片上传失败:', error);
              setGlobalUploadStatus('error');
              Alert.alert('上传失败', '图片上传失败，请重试');
            },
            onProgress: (loaded, total) => {
              const progressPercent = total > 0 ? (loaded / total) * 100 : 0;
              setGlobalUploadProgress(progressPercent);
              console.log('[PosterGeneration] 拍照图片上传进度:', progressPercent + '%');
            }
          }
        );
      }
      
      console.log('[PosterGeneration] 拍照图片设置完成，保持当前页面状态');
    }
    // 如果不是从首页拍照跳转，且当前参考图为空或未处理过，初始化默认参考图
    else if (!fromHomeCamera && !capturedImageProcessed && referenceImages.length === 0) {
      const cfg = TAB_CONFIGS[selectedStyle];
      const defaultImages = cfg?.referenceImages || [];
      console.log('[PosterGeneration] 正常模式：设置默认参考图:', { tab: selectedStyle, images: defaultImages });
      if (defaultImages.length > 0) {
        setReferenceImages(defaultImages);
      }
      setCapturedImageProcessed(true);
    }
    // 其他情况不做处理，保持当前状态（包括用户修改的参考图）
  }, [fromHomeCamera, needsUpload, capturedImage, capturedImageProcessed, selectedStyle, referenceImages.length, tabsLoading]);

  // 监听上传状态的统一更新
  useEffect(() => {
    // 如果替换完成，重置状态
    if (globalUploadStatus === 'success' && replacingIndex !== undefined) {
      setTimeout(() => {
        setReplacingIndex(undefined);
        setGlobalUploadStatus('idle');
        setGlobalUploadProgress(0);
      }, 500);
    }
  }, [globalUploadStatus, replacingIndex]);

  const { 
    selectFiles, 
    takePhoto,
    status: uploadStatus, 
    progress: uploadProgress 
  } = useFileUpload({
    maxFiles: 1, // 恢复为1，因为替换使用独立函数
    allowedTypes: ['image/*'],
    onSuccess: (files) => {
      if (files.length > 0) {
        // 只用于添加模式
        setReferenceImages(prev => {
          const newImages = [...prev];
          if (newImages.length < 4) {
            newImages.push(files[0].url);
          }
          return newImages;
        });
        console.log('[PosterGeneration] 参考图片添加成功:', files[0].url);
        setGlobalUploadStatus('success');
        setGlobalUploadProgress(100);
        
        // 添加图片后，清除当前tab的删除标记
        setTabDeletedStates(prev => {
          const newState = { ...prev };
          delete newState[selectedStyle];
          return newState;
        });
      }
    },
    onError: (error) => {
      Alert.alert('上传失败', error.message);
      setGlobalUploadStatus('error');
    },
    onProgress: (loaded, total) => {
      const progressPercent = total > 0 ? (loaded / total) * 100 : 0;
      setGlobalUploadProgress(progressPercent);
      setGlobalUploadStatus('uploading');
    }
  });

  // 获取bottomPanel的动态样式
  const getBottomPanelStyle = useCallback(() => {
    const baseStyle = [styles.bottomPanel];
    
    if (Platform.OS === 'web') {
      return [...baseStyle, { flex: 1 }];
    }
    
    if (!isKeyboardVisible) {
      return [...baseStyle, { flex: 1 }];
    }
    
    if (bottomPanelHeight && bottomPanelHeight > 0) {
      const calculatedHeight = Math.max(200, bottomPanelHeight - keyboardHeight + 157);
      console.log('[PosterGeneration] bottomPanel 高度计算:', {
        内容高度: bottomPanelHeight,
        键盘高度: keyboardHeight,
        偏移值: 157,
        计算高度: calculatedHeight
      });
      return [...baseStyle, { height: calculatedHeight }];
    }
    
    return baseStyle;
  }, [isKeyboardVisible, bottomPanelHeight, keyboardHeight]);

  // 构建最终API参数
  const buildFinalApiParams = useCallback(() => {
    const finalPrompt = generatePrompt(selectedStyle, dishName);
    const config = TAB_CONFIGS[selectedStyle];
    const currentAspectRatio = ASPECT_RATIOS.find(ar => ar.name === aspectRatio);
    
    if (!currentAspectRatio) {
      return null;
    }

    // 准备所有参考图：系统默认参考图（如果有）+ 页面默认参考图 + 用户选择的参考图
    const allReferenceImages = [
      ...(config?.systemReferenceImage ? [config.systemReferenceImage] : []),
      ...referenceImages // 页面显示的参考图（包括默认和用户上传的）
    ];

    // 构建最终的API参数（传递给seedream的参数）
    const apiParams = {
      model: 'doubao-seedream-4-0-250828',
      prompt: finalPrompt,
      image: allReferenceImages.length > 0 ? allReferenceImages : undefined,
      size: currentAspectRatio.ratio, // 直接使用用户选择的比例
      watermark: false,
      sequential_image_generation: 'auto',
      sequential_image_generation_options: {
        max_images: parallelImageCount // 使用并行生图数量
      },
      optimize_prompt_options: {
        mode: 'fast'
      }
    };

    // 根据返回格式添加相应参数
    if (responseFormat === 'base64') {
      (apiParams as any).response_format = 'b64_json';
    }

    return apiParams;
  }, [selectedStyle, dishName, aspectRatio, parallelImageCount, responseFormat, referenceImages, generatePrompt]);

  // 监听tab切换，同时更新参考图
  const handleStyleSelect = useCallback((styleName: string) => {
    console.log('[PosterGeneration] 切换tab:', styleName);
    
    // 检查当前是否有用户自定义的参考图（非默认图片）
    const currentConfig = TAB_CONFIGS[selectedStyle];
    const hasUserImages = currentConfig
      ? referenceImages.some(img => !currentConfig.referenceImages.includes(img))
      : referenceImages.length > 0;
    
    // 如果有用户自定义的参考图，则保留用户修改的图片
    if (hasUserImages && referenceImages.length > 0) {
      console.log('[PosterGeneration] 检测到用户修改的参考图，保留修改');
      // 不更新参考图，保持用户当前的选择
      setSelectedStyle(styleName);
      return;
    }
    
    // 检查新tab是否被用户删除过
    const newConfig = TAB_CONFIGS[styleName];
    const isNewTabDeleted = tabDeletedStates[styleName];
    
    if (isNewTabDeleted) {
      console.log('[PosterGeneration] tab已被用户删除，保持空状态:', styleName);
      // 如果新tab被删除过，则保持空状态
      setSelectedStyle(styleName);
      setReferenceImages([]);
      return;
    }
    
    // 如果没有用户自定义的参考图且新tab未被删除，则更新为新tab的默认参考图
    setSelectedStyle(styleName);
    if (newConfig?.referenceImages) {
      setReferenceImages(newConfig.referenceImages);
    }
  }, [selectedStyle, referenceImages, tabDeletedStates]);

  const aspectRatios = ['3:4', '1:1', '9:16'];

  // 键盘监听 - 使用keyboardWillShow确保与键盘弹起完全同步
  useEffect(() => {
    // 使用keyboardWillShow确保动画与键盘弹起同步
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (event) => {
      const newKeyboardHeight = event.endCoordinates.height;
      setKeyboardHeight(newKeyboardHeight);
      setIsKeyboardVisible(true);
      console.log('[PosterGeneration] 键盘即将弹起，高度:', newKeyboardHeight);
      
      // 使用键盘的动画时长，确保完全同步
      const duration = event.duration || 150;
      Animated.parallel([
        Animated.timing(keyboardAnimation, {
          toValue: -157,
          duration: duration,
          useNativeDriver: true,
          delay: 0,
        }),
        Animated.timing(titleOpacityAnimation, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
          delay: 0,
        })
      ]).start();
    });

    // 使用keyboardWillHide确保动画与键盘收起完全同步
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', (event) => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      console.log('[PosterGeneration] 键盘即将收起');
      
      // 使用键盘的动画时长，确保完全同步
      const duration = event.duration || 150;
      Animated.parallel([
        Animated.timing(keyboardAnimation, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
          delay: 0,
        }),
        Animated.timing(titleOpacityAnimation, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
          delay: 0,
        })
      ]).start();
    });

    // 降级方案：如果系统不支持Will事件，使用Did事件
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      const newKeyboardHeight = event.endCoordinates.height;
      setKeyboardHeight(newKeyboardHeight);
      setIsKeyboardVisible(true);
      console.log('[PosterGeneration] 键盘弹起（降级），高度:', newKeyboardHeight);
      
      Animated.parallel([
        Animated.timing(keyboardAnimation, {
          toValue: -157,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacityAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      console.log('[PosterGeneration] 键盘收起（降级）');
      
      Animated.parallel([
        Animated.timing(keyboardAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacityAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    });

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // 处理点击非输入框区域收起键盘
  const handleBackdropPress = useCallback(() => {
    if (isKeyboardVisible) {
      Keyboard.dismiss();
      console.log('[PosterGeneration] 点击背景区域收起键盘');
    }
  }, [isKeyboardVisible]);

  interface Style {
    id: string;
    name: string;
    gradientColors: readonly [string, string];
    image: string;
  }
  const [stylesList, setStylesList] = useState<Style[]>([]);

  useEffect(() => {
    const loadTabs = async () => {
      setTabsLoading(true);
      if (!SUPA_URL || !SUPA_ANON) {
        setTabsLoading(false);
        return;
      }
      let res = await fetch(`${SUPA_URL}/rest/v1/haibao-generation-tab?select=*&order=num.asc`, {
        headers: {
          Authorization: `Bearer ${SUPA_ANON}`,
          apikey: SUPA_ANON,
        },
      });
      if (!res.ok) {
        console.error('[PosterGeneration] Supabase tabs fetch failed:', res.status);
        setTabsLoading(false);
        return;
      }
      const rows: any[] = await res.json();
      console.log('[PosterGeneration] Supabase tabs fetched:', rows?.length ?? 0);
      const configs: Record<string, TabConfig> = {};
      const styles: Style[] = [];
      for (const row of rows) {
        const label = row['tab-name'] || row['name'] || row['title'] || String(row['id'] ?? row['num'] ?? '');
        const userVal = row['tab-cankao-user'];
        let refs: string[] = [];
        if (Array.isArray(userVal)) {
          refs = userVal.filter((x: any) => typeof x === 'string');
        } else if (typeof userVal === 'string') {
          const s = userVal.trim();
          if (s.startsWith('[')) {
            try {
              const arr = JSON.parse(s);
              if (Array.isArray(arr)) refs = arr.filter((x: any) => typeof x === 'string');
            } catch {}
          } else if (s.includes(',')) {
            refs = s.split(',').map((x) => x.trim()).filter(Boolean);
          } else if (s) {
            refs = [s];
          }
        }
        configs[label] = {
          referenceImages: refs,
          systemReferenceImage: row['tab-cankao-sys'] || null,
          promptTemplate: row['tab-prompt'] || undefined,
          inputPlaceholder: row['tab-placeholder'] || undefined,
        };
        styles.push({
          id: label,
          name: label,
          gradientColors: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)'],
          image: row['tab-pre'] || '',
        } as Style);
      }
      Object.assign(TAB_CONFIGS, configs);
      setStylesList(styles);
      if (styles.length) {
        setSelectedStyle(styles[0].id);
        const cfg = configs[styles[0].id];
        if (cfg?.referenceImages?.length) setReferenceImages(cfg.referenceImages);
      }
      setTabsLoading(false);
    };
    loadTabs().catch(() => {
      setTabsLoading(false);
    });
  }, []);

  const handleAddReferenceImage = useCallback(() => {
    if (referenceImages.length >= 4 || isResuming) {
      Alert.alert('提示', '最多只能添加4张参考图');
      return;
    }
    
    Alert.alert(
      '添加参考图片',
      '请选择添加方式',
      [
        {
          text: '拍照',
          onPress: () => takePhoto(),
        },
        {
          text: '从相册选择',
          onPress: () => selectFiles(),
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [takePhoto, selectFiles, referenceImages.length, isResuming]);

  const handleRemoveReferenceImage = useCallback((index: number) => {
    const newImages = referenceImages.filter((_, i) => i !== index);
    setReferenceImages(newImages);
    
    // 如果删除后图片为空，标记当前tab为已删除状态
    if (newImages.length === 0) {
      setTabDeletedStates(prev => ({
        ...prev,
        [selectedStyle]: true
      }));
      console.log('[PosterGeneration] 标记tab为已删除状态:', selectedStyle);
    }
  }, [referenceImages, selectedStyle]);

  const handleReplaceReferenceImage = useCallback((index: number) => {
    if (referenceImages[index]) {
      Alert.alert(
        '替换参考图片',
        '请选择替换方式',
        [
          {
            text: '拍照',
            onPress: () => {
              replaceImageWithPhoto(index);
            },
          },
          {
            text: '从相册选择',
            onPress: () => {
              replaceImageFromGallery(index);
            },
          },
          {
            text: '取消',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  }, [referenceImages]);

  // 专门用于替换的拍照函数
  const replaceImageWithPhoto = useCallback(async (index: number) => {
    try {
      console.log('[PosterGeneration] 开始拍照替换图片:', index);
      setReplacingIndex(index); // 设置当前替换的索引
      setGlobalUploadStatus('uploading');
      setGlobalUploadProgress(0);

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        throw new Error('需要相机权限才能拍照。请在设置中允许应用访问相机。');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // 禁用编辑模式，避免自动剪裁为正方形
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[PosterGeneration] 用户取消了拍照');
        setReplacingIndex(undefined); // 重置替换索引
        setGlobalUploadStatus('idle');
        return;
      }

      const asset = result.assets[0];

      // 直接从URI上传，使用统一的上传状态
      await uploadFromUri(
        asset.uri,
        asset.fileName || `photo_${Date.now()}.jpg`,
        asset.mimeType,
        {
          maxSize: 10 * 1024 * 1024,
          allowedTypes: ['image/*'],
          maxFiles: 1,
          onSuccess: (files: any[]) => {
            if (files.length > 0) {
              setReferenceImages(prev => {
                const newImages = [...prev];
                newImages[index] = files[0].url;
                return newImages;
              });
              console.log('[PosterGeneration] 拍照替换成功:', { index, url: files[0].url });
              setGlobalUploadStatus('success');
              setGlobalUploadProgress(100);
              
              // 如果替换后图片不为空，清除当前tab的删除标记
              if (referenceImages.length > 0) {
                setTabDeletedStates(prev => {
                  const newState = { ...prev };
                  delete newState[selectedStyle];
                  return newState;
                });
              }
            }
          },
          onError: (error: Error) => {
            Alert.alert('替换失败', error.message);
            setReplacingIndex(undefined); // 错误时重置替换索引
            setGlobalUploadStatus('error');
          },
          onProgress: (loaded: number, total: number) => {
            const progressPercent = total > 0 ? (loaded / total) * 100 : 0;
            setGlobalUploadProgress(progressPercent);
            console.log('[PosterGeneration] 替换进度:', progressPercent + '%');
          }
        }
      );
      
    } catch (error) {
      console.error('[PosterGeneration] 拍照替换失败:', error);
      Alert.alert('替换失败', error instanceof Error ? error.message : '拍照失败');
      setReplacingIndex(undefined); // 错误时重置替换索引
      setGlobalUploadStatus('error');
    }
  }, []);

  // 专门用于替换的相册选择函数
  const replaceImageFromGallery = useCallback(async (index: number) => {
    try {
      console.log('[PosterGeneration] 开始从相册替换图片:', index);
      setReplacingIndex(index); // 设置当前替换的索引
      setGlobalUploadStatus('uploading');
      setGlobalUploadProgress(0);

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error('需要相册权限才能选择图片');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[PosterGeneration] 用户取消了相册选择');
        setReplacingIndex(undefined); // 重置替换索引
        setGlobalUploadStatus('idle');
        return;
      }

      const asset = result.assets[0];

      // 直接从URI上传，使用统一的上传状态
      await uploadFromUri(
        asset.uri,
        asset.fileName || `image_${Date.now()}.jpg`,
        asset.mimeType,
        {
          maxSize: 10 * 1024 * 1024,
          allowedTypes: ['image/*'],
          maxFiles: 1,
          onSuccess: (files: any[]) => {
            if (files.length > 0) {
              setReferenceImages(prev => {
                const newImages = [...prev];
                newImages[index] = files[0].url;
                return newImages;
              });
              console.log('[PosterGeneration] 相册替换成功:', { index, url: files[0].url });
              setGlobalUploadStatus('success');
              setGlobalUploadProgress(100);
              
              // 如果替换后图片不为空，清除当前tab的删除标记
              if (referenceImages.length > 0) {
                setTabDeletedStates(prev => {
                  const newState = { ...prev };
                  delete newState[selectedStyle];
                  return newState;
                });
              }
            }
          },
          onError: (error: Error) => {
            Alert.alert('替换失败', error.message);
            setReplacingIndex(undefined); // 错误时重置替换索引
            setGlobalUploadStatus('error');
          },
          onProgress: (loaded: number, total: number) => {
            const progressPercent = total > 0 ? (loaded / total) * 100 : 0;
            setGlobalUploadProgress(progressPercent);
            console.log('[PosterGeneration] 替换进度:', progressPercent + '%');
          }
        }
      );
      
    } catch (error) {
      console.error('[PosterGeneration] 相册替换失败:', error);
      Alert.alert('替换失败', error instanceof Error ? error.message : '选择失败');
      setReplacingIndex(undefined); // 错误时重置替换索引
      setGlobalUploadStatus('error');
    }
  }, []);

  const handleParallelImageCountChange = useCallback((count: number) => {
    setParallelImageCount(count);
    console.log('[PosterGeneration] 并行生图数量设置为:', count);
  }, []);


  const handleResetRemainingCount = useCallback(() => {
    Alert.alert(
      '重置剩余次数',
      '确定要重置今日剩余生图次数为默认值吗？此操作用于测试。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: async () => {
            const success = await resetRemainingCount();
            if (success) {
              Alert.alert('成功', '已重置剩余次数为 10 次');
            } else {
              Alert.alert('失败', '重置剩余次数失败，请重试');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [resetRemainingCount]);
  
  const handleGenerate = useCallback(async () => {
    console.log('[PosterGeneration] 开始4次并行生图');
    
    // 检查是否有正在进行的生成，如果有则跳转到结果页
    if (hasActiveGeneration && generationState) {
      console.log('[PosterGeneration] 检测到正在进行的生成，跳转到结果页');
      router.push({
        pathname: '/generation-result',
        params: {
          prompt: generationState.prompt,
          referenceImages: JSON.stringify(generationState.referenceImages),
          aspectRatio: JSON.stringify(ASPECT_RATIOS.find(ar => ar.name === generationState.aspectRatio) || ASPECT_RATIOS[0]),
          imageCount: generationState.imageCount.toString(),
          stream: generationState.streamEnabled.toString(),
          responseFormat: generationState.responseFormat,
          uid: generationState.uid
        }
      });
      return;
    }
    
    // 移除菜品名必填验证，因为现在支持空值
    
    // 如果正在恢复状态，不允许生成
    if (isResuming) {
      Alert.alert('提示', '应用正在恢复状态，请稍后再试');
      return;
    }
    
    // 只检查剩余次数，不消耗
    const canGenerate = await getRemainingCount();
    if (canGenerate <= 0) {
      Alert.alert('提示', '今日生成次数已用完，请明天再试');
      return;
    }

    // 获取当前用户ID
    let uid = '';
    try {
      uid = await AsyncStorage.getItem('userUid') || '';
      if (!uid) {
        // 兼容旧版本数据格式
        const authData = await AsyncStorage.getItem('authData');
        if (authData) {
          const parsed = JSON.parse(authData);
          uid = parsed.uid || '';
        }
      }
    } catch (error) {
      console.error('[PosterGeneration] 获取用户ID失败:', error);
    }

    if (!uid) {
      Alert.alert('错误', '用户信息不完整，请重新登录');
      return;
    }

    // 获取当前选中的比例配置
    const currentAspectRatio = ASPECT_RATIOS.find(ar => ar.name === aspectRatio);
    if (!currentAspectRatio) {
      Alert.alert('错误', '未找到选择的尺寸配置');
      return;
    }

    // 生成最终提示词
    const finalPrompt = generatePrompt(selectedStyle, dishName);

    // 准备所有参考图：系统默认参考图（如果有）+ 页面默认参考图 + 用户选择的参考图
    const config = TAB_CONFIGS[selectedStyle];
    const allReferenceImages = [
      ...(config.systemReferenceImage ? [config.systemReferenceImage] : []), // 系统默认参考图作为第一张
      ...referenceImages // 页面显示的参考图（包括默认和用户上传的）
    ];

    // 保存生成状态，固定为4张图片（4次并行生成）
    await generationStateService.startGeneration({
      prompt: finalPrompt,
      referenceImages: allReferenceImages,
      aspectRatio: aspectRatio,
      imageCount: parallelImageCount, // 使用并行生图数量
      uid: uid,
      streamEnabled: false, // 关闭流式，使用并行批量生成
      responseFormat: responseFormat
    });

    // 更新本地状态
    setHasActiveGeneration(true);
    setHasCompletedGeneration(false);
    setGenerationState({
      isGenerating: true,
      isCompleted: false,
      startTime: Date.now(),
      prompt: finalPrompt,
      referenceImages: allReferenceImages,
      aspectRatio: aspectRatio,
      imageCount: parallelImageCount, // 使用并行生图数量
      uid: uid,
      streamEnabled: false,
      responseFormat: responseFormat
    });

    setIsGenerating(true);
    try {
      console.log('[PosterGeneration] 开始并行生图:', {
        style: selectedStyle,
        referenceImages: allReferenceImages,
        dishName,
        finalPrompt,
        aspectRatio: currentAspectRatio.name,
        dimensions: currentAspectRatio.dimensions,
        uid,
        parallelImageCount
      });
      
      // 跳转到生成结果页面，传递并行生成数量
      router.push({
        pathname: '/generation-result',
        params: {
          prompt: finalPrompt,
          referenceImages: JSON.stringify(allReferenceImages),
          aspectRatio: JSON.stringify(currentAspectRatio),
          imageCount: parallelImageCount.toString(), // 使用并行生图数量
          stream: 'false', // 关闭流式
          responseFormat: responseFormat,
          uid,
          isParallelGeneration: 'true' // 标识为并行生成模式
        }
      });
      
    } catch (error) {
      console.error('[PosterGeneration] 生成失败:', error);
      Alert.alert('生成失败', error instanceof Error ? error.message : '未知错误');
      
      // 生成失败时清除状态
      await generationStateService.clearGenerationState();
      setHasActiveGeneration(false);
      setHasCompletedGeneration(false);
      setGenerationState(null);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedStyle, referenceImages, aspectRatio, parallelImageCount, getRemainingCount, dishName, generatePrompt, hasActiveGeneration, generationState, responseFormat, router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* 固定背景图片层 */}
      <Image 
        source={require('../assets/UI/generation-img-bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* 头部区域 */}
      <View style={[styles.fixedHeader, { height: 52 + statusBarHeight }]}>
        <PosterGenerationHeader />
      </View>
      
      {/* 主内容区域 - 使用动画容器来处理键盘弹起时的上移 */}
      <Animated.View style={[
        styles.mainContainer,
        Platform.OS !== 'web' && {
          transform: [{ translateY: keyboardAnimation }],
        }
      ]}>
        {/* 标题区域 */}
        <TouchableOpacity
          onLongPress={() => setShowMoreOptions(true)}
          delayLongPress={800}
          activeOpacity={0.7}
        >
          <Animated.View style={[
            styles.titleSection,
            Platform.OS !== 'web' && {
              opacity: titleOpacityAnimation,
            }
          ]}>
            <View style={styles.subtitleContainer}>
              {subtitleSvgUri ? (
                <SvgUri width={156} height={20} uri={subtitleSvgUri} style={styles.subtitleImage} />
              ) : null}
            </View>
            <View style={styles.titleContainer}>
              {titleSvgUri ? (
                <SvgUri width={273} height={30} uri={titleSvgUri} style={styles.titleImage} />
              ) : null}
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Tab选择区域 */}
        <View style={styles.tabSection}>
          {tabsLoading ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          ) : (
            <StyleTabSelector
              styles={stylesList}
              selectedStyle={selectedStyle}
              onStyleSelect={handleStyleSelect}
            />
          )}
        </View>

        {/* 固定底部参数区域 - 动态高度调整 */}
        <Animated.View 
          ref={bottomPanelRef}
          onLayout={measureBottomPanel}
          style={getBottomPanelStyle()}
        >
          {tabsLoading ? (
            <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          ) : (
            <ReferenceImageUploadWithDefault
              referenceImages={referenceImages}
              uploadStatus={globalUploadStatus}
              uploadProgress={globalUploadProgress}
              onAddImage={handleAddReferenceImage}
              onRemoveImage={handleRemoveReferenceImage}
              onReplaceImage={handleReplaceReferenceImage}
              replacingIndex={replacingIndex}
            />
          )}

          <PromptInput
            dishName={dishName}
            onDishNameChange={setDishName}
            placeholder={TAB_CONFIGS[selectedStyle]?.inputPlaceholder || ''}
          />

          {/* GenerationToolbar组件已隐藏更多按钮，更多选项通过长按标题触发 */}
          <GenerationToolbar
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            remainingCount={remainingCount}
            parallelImageCount={parallelImageCount}
            onParallelImageCountChange={handleParallelImageCountChange}
            onResetRemainingCount={handleResetRemainingCount}

          />

          {/* 更多选项弹框 - 通过长按标题触发 */}
          <MoreOptionsModal
            visible={showMoreOptions}
            onClose={() => setShowMoreOptions(false)}
            onParallelImageCountChange={handleParallelImageCountChange}
            onResetRemainingCount={handleResetRemainingCount}
            currentImageCount={parallelImageCount}
            currentPrompt={generatePrompt(selectedStyle, dishName)}
            systemReferenceImage={TAB_CONFIGS[selectedStyle]?.systemReferenceImage || undefined}
            finalApiParams={buildFinalApiParams() || undefined}
            responseFormat={responseFormat}
            onResponseFormatChange={setResponseFormat}
            hasActiveGeneration={hasActiveGeneration}
            hasCompletedGeneration={hasCompletedGeneration}
          />
        </Animated.View>

        {/* 键盘弹起时的背景点击区域 */}
        {isKeyboardVisible && Platform.OS !== 'web' && !isResuming && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 52 + statusBarHeight,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent',
              zIndex: 1.5,
            }}
            onPress={handleBackdropPress}
            activeOpacity={1}
          />
        )}
      </Animated.View>

    </View>
  );
}
