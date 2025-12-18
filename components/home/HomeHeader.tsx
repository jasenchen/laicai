import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ImageBackground, Platform, Dimensions } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

export const HomeHeader: React.FC = () => {
  const [camSvgUri, setCamSvgUri] = useState<string | null>(null);
  const [addCircleSvgUri, setAddCircleSvgUri] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(408);
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 40);
  const [greetingWidth, setGreetingWidth] = useState(Dimensions.get('window').width - 40);
  const dateLabel = useMemo(() => {
    const now = new Date();
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${now.getDate()} ${dayNames[now.getDay()]}`;
  }, []);
  
  // 计算剩余高度：总高度减去顶部状态栏、问候文案等固定元素的高度
  const remainingHeight = useMemo(() => {
    // 顶部状态栏高度 + 间距 + 问候文案区域高度 + 间距 + 底部间距
    const topBarHeight = 40; // 顶部状态栏区域
    const topSpacing = 8; // 顶部状态栏下的间距
    const greetingHeight = 85; // 问候文案区域（包括背景图）
    const bottomSpacing = 25; // 问候文案下的间距
    const paddingBottom = 12; // 底部内边距
    const paddingTop = 74; // 顶部内边距
    
    return headerHeight - paddingTop - topBarHeight - topSpacing - greetingHeight - bottomSpacing - paddingBottom;
  }, [headerHeight]);
  
  // 获取背景图尺寸并计算适配高度
  useEffect(() => {
    const calculateHeaderDimensions = () => {
      // 背景图的原始宽高比 (根据设计稿确定)
      const bgImageAspectRatio = 335 / 408; // 背景图实际显示区域的宽高比
      const screenWidth = Platform.OS === 'web' && typeof window !== 'undefined' 
        ? window.innerWidth 
        : Dimensions.get('window').width;
      
      // 容器宽度为屏幕宽度减去两侧20px
      const calculatedWidth = screenWidth - 40;
      const calculatedHeight = calculatedWidth / bgImageAspectRatio;
      
      setContainerWidth(calculatedWidth);
      setHeaderHeight(calculatedHeight);
      
      // 动态计算问候语宽度，随容器宽度自适应
      setGreetingWidth(calculatedWidth - 40);
    };
    
    calculateHeaderDimensions();
    
    // Web端监听窗口大小变化
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleResize = () => {
        calculateHeaderDimensions();
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    
    // 移动端监听屏幕尺寸变化
    const subscription = Dimensions.addEventListener('change', calculateHeaderDimensions);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cam = Asset.fromModule(require('../../assets/UI/ic_cam.svg'));
        await cam.downloadAsync();
        setCamSvgUri(cam.localUri || cam.uri);
      } catch {}
    })();
    (async () => {
      try {
        const add = Asset.fromModule(require('../../assets/UI/ic-add-circle.svg'));
        await add.downloadAsync();
        setAddCircleSvgUri(add.localUri || add.uri);
      } catch {}
    })();
  }, []);
  const handlePromoUpload = useCallback(async () => {
    try {
      console.log('[HomeHeader] 开始拍照用于朋友圈宣传图');
      
      // 请求相机权限
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('需要相机权限', '请在设置中允许应用访问相机才能拍照');
        return;
      }

      // 启动相机拍照
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[HomeHeader] 用户取消了拍照');
        return;
      }

      const asset = result.assets[0];
      console.log('[HomeHeader] 拍照成功，准备跳转:', asset.uri);
      
      // 立即跳转到海报生成页面，传递本地URI，在上传状态中处理
      router.push({
        pathname: '/poster-generation',
        params: {
          capturedImage: asset.uri, // 传递本地URI而不是上传后的URL
          fromHomeCamera: 'true',
          needsUpload: 'true' // 标识需要上传
        }
      });
      
      console.log('[HomeHeader] 立即跳转到海报生成页面，参数:', {
        capturedImage: asset.uri,
        fromHomeCamera: 'true',
        needsUpload: 'true'
      });
      
    } catch (error) {
      console.error('[HomeHeader] 拍照失败:', error);
      Alert.alert('拍照失败', error instanceof Error ? error.message : '拍照失败，请重试');
    }
  }, []);

  const handleCopyWriting = useCallback(() => {
    Alert.alert('正在开发中', '写朋友圈文案功能即将上线');
  }, []);

  const cardData = useMemo(() => [
    {
      title: '做朋友圈宣传图',
      tag: '随手拍',
      tagIcon: require('../../assets/UI/ic_cam.svg'),
      previewImage: require('../../assets/UI/img-pyq.png'),
    },
    {
      title: '写朋友圈文案',
      tag: '来一段',
      tagIcon: require('../../assets/UI/ic-add-circle.svg'),
      previewImage: require('../../assets/UI/img-pyqwa.png'),
    },
  ], []);
  return (
    <View style={[styles.container, { height: headerHeight, width: containerWidth }]}>
      {/* 背景容器 */}
      <ImageBackground
        source={require('../../assets/UI/bg.png')}
        style={[styles.bgContainer, { width: containerWidth }]}
        imageStyle={styles.bgImage}
      >
        {/* 顶部状态栏 */}
        <View style={styles.topbar}>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text style={styles.weather}>🌩</Text>
        </View>

        {/* 问候文案 */}
        <View style={[styles.greeting, { width: greetingWidth }]}>
          <Image
            source={require('../../assets/UI/line.png')}
            style={styles.greetingBg}
            resizeMode="contain"
          />
          <Text style={styles.greetingTitle}>Hi, 亲爱的Chic.老板</Text>
          <Text style={styles.greetingDesc}>
            这周没怎么发朋友圈？趁着双节，抓紧拍拍店面和你的招牌炸鸡发一下吧~
          </Text>
        </View>

        {/* 两个动态高度入口 - 占满header剩余高度 */}
        <View style={[styles.actions, { height: remainingHeight }]}>
          <TouchableOpacity key="promo" style={styles.card} onPress={handlePromoUpload} activeOpacity={0.85}>
            <View style={styles.cardContent}>
              <View style={styles.cardTopContent}>
                <Text style={[styles.cardTitle, styles.cardTitlePromo]}>{cardData[0].title}</Text>
                <View style={styles.cardTag}>
                  {camSvgUri ? (
                    <SvgUri width={14} height={14} uri={camSvgUri} style={styles.tagIcon} />
                  ) : null}
                  <Text style={styles.tagText}>{cardData[0].tag}</Text>
                </View>
              </View>
              <View style={styles.cardPreview}>
                <Image
                  source={cardData[0].previewImage}
                  style={styles.promoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity key="copy" style={styles.card} onPress={handleCopyWriting} activeOpacity={0.85}>
            <View style={styles.cardContent}>
              <View style={styles.cardTopContent}>
                <Text style={[styles.cardTitle, styles.cardTitleCopy]}>{cardData[1].title}</Text>
                <View style={styles.cardTag}>
                  {addCircleSvgUri ? (
                    <SvgUri width={14} height={14} uri={addCircleSvgUri} style={styles.tagIcon} />
                  ) : null}
                  <Text style={styles.tagText}>{cardData[1].tag}</Text>
                </View>
              </View>
              <View style={styles.cardPreview}>
                <Image
                  source={cardData[1].previewImage}
                  style={styles.contentImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    alignSelf: 'center',
  },

  bgContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 74,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bgImage: {
    resizeMode: 'contain',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginTop: 8,
  },
  date: {
    fontSize: 13,
    lineHeight: 26,
    color: '#868da582',
    minWidth: 46,
    fontWeight: '600',
  },
  weather: {
    fontSize: 20,
    lineHeight: 20,
    color: '#0f1e2b47',
    minWidth: 20,
    marginLeft: 6,
  },
  greeting: {
    marginLeft: 10,
    marginTop: 20,
    marginBottom: 25,
  },
  greetingBg: {
    position: 'absolute',
    left: 26,
    top: 59,
    width: 57,
    height: 17,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f1e2b',
    zIndex: 1,
    fontFamily: 'LingGanHei'
  },
  greetingDesc: {
    fontSize: 14,
    lineHeight: 26,
    color: '#0f1e2b',
    marginTop: 2,
    zIndex: 2,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    // 移除固定高度，改为动态传入
  },
  card: {
    flex: 1,
    backgroundColor: '#f3f7ff',
    borderRadius: 24,
    paddingTop: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
  },
  cardTopContent: {
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#0f1e2b',
    marginLeft: 16,
    fontWeight: '600',
  },
  cardTitlePromo: {
    fontFamily: 'LingGanHei'
  },
  cardTitleCopy: {
    fontFamily: 'LingGanHei'
  },
  cardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 18,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 1,
    minHeight: 26,
    backgroundColor: '#0f1e2b',
    borderRadius: 100,
    shadowColor: 'rgba(71, 83, 94, 0.25)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'flex-start',
  },
  tagIcon: { 
    width: 14, 
    height: 14,
    marginRight: 4,
    resizeMode: 'contain',
  },
  tagText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#ffffff',
    minWidth: 36,
    fontWeight: '600',
    fontFamily: 'LingGanHei'
  },
  cardPreview: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: 91,
    resizeMode: 'contain',
  },

  contentImage: {
    width: '100%',
    height: 96,
    resizeMode: 'contain',
  },
});
