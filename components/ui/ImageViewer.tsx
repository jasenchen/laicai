import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Colors } from '@/constants/Colors';
import { ImageViewerModal } from './ImageViewerModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
  title?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  imageUrl,
  onClose,
  title,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveImage = async () => {
    if (!imageUrl || isSaving) return;

    try {
      setIsSaving(true);
      console.log('[ImageViewer] 开始保存图片到相册:', imageUrl);

      // 请求媒体库权限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能保存图片，请在设置中开启权限');
        return;
      }

      // Web端处理
      if (Platform.OS === 'web') {
        // Web端创建下载链接
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `image_${Date.now()}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('保存成功', '图片已开始下载');
        return;
      }

      // 移动端处理
      // 下载图片到本地临时目录
      const localUri = `${FileSystem.documentDirectory}image_${Date.now()}.jpg`;
      const downloadResumable = FileSystem.createDownloadResumable(
        imageUrl,
        localUri,
        {},
        (downloadProgressInfo) => {
          const progress = downloadProgressInfo.totalBytesWritten / downloadProgressInfo.totalBytesExpectedToWrite;
          console.log('[ImageViewer] 下载进度:', Math.round(progress * 100) + '%');
        }
      );

      const downloadResult = await downloadResumable.downloadAsync();
      if (!downloadResult?.uri) {
        throw new Error('图片下载失败');
      }

      console.log('[ImageViewer] 图片下载完成:', downloadResult.uri);

      // 保存到相册
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      console.log('[ImageViewer] 图片已保存到相册:', asset);

      // 删除临时文件
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });

      Alert.alert('保存成功', '图片已保存到相册');
    } catch (error) {
      console.error('[ImageViewer] 保存图片失败:', error);
      Alert.alert('保存失败', error instanceof Error ? error.message : '保存图片时出现错误');
    } finally {
      setIsSaving(false);
    }
  };

  // 重写为使用ImageViewerModal，但保持原有的保存功能
  return (
    <ImageViewerModal
      visible={visible}
      imageUrl={imageUrl}
      onClose={onClose}
    />
  );
};