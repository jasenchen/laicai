import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

const DEFAULT_REFERENCE_IMAGE = 'https://cdn-tos-cn.bytedance.net/obj/aipa-tos/db56dd41-685e-441a-8776-840d5af7ca9d/cankao-pinzhihaibao.png';

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

interface ReferenceImageUploadProps {
  referenceImages: string[];
  uploadStatus: 'idle' | 'selecting' | 'uploading' | 'success' | 'error';
  uploadProgress: number;
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
  onReplaceImage: (index: number) => void;
  replacingIndex?: number; // 新增：当前正在替换的图片索引
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  addButtonIcon: {
    width: 14,
    height: 14,
  },
  uploadButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.35)',
  },
  imageContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  imageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    zIndex: 0,
  },
  uploadedImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    zIndex: -1,
  },
  replaceText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    zIndex: 2,
  },
  removeButton: {
    position: 'absolute',
    right: -6,
    top: -6,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#00000033',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
    borderRadius: 10,
  },
  removeButtonLine: {
    width: 11,
    height: 3,
    backgroundColor: '#000000',
    borderRadius: 999,
  },
  uploadProgress: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  uploadProgressText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 2,
  },
});

export const ReferenceImageUpload: React.FC<ReferenceImageUploadProps> = ({
  referenceImages,
  uploadStatus,
  uploadProgress,
  onAddImage,
  onRemoveImage,
  onReplaceImage,
  replacingIndex,
}) => {
  const hasMaxImages = referenceImages.length >= 1;
  
  return (
    <View style={styles.container}>
      {/* 添加参考图按钮 - 仅在未达到上限时显示 */}
      {!hasMaxImages && (
        <TouchableOpacity style={styles.uploadButton} onPress={onAddImage}>
          <SvgIcon 
            width={14}
            height={14}
            uri="https://cdn-tos-cn.bytedance.net/obj/aipa-tos/b66c51cb-87cc-43ec-a76e-e11625163404/ic-add.svg"
            style={styles.addButtonIcon}
          />
          <Text style={styles.uploadButtonText}>参考图</Text>
        </TouchableOpacity>
      )}

      {/* 已添加的参考图 - 从左到右排列在添加按钮右侧 */}
      {referenceImages.map((imageUrl, index) => (
        <View key={index} style={styles.imageContainer}>
          {/* 渐变背景 */}
          <View style={styles.imageBackground} />
          
          {/* 图片层 */}
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.uploadedImage}
            resizeMode="cover"
          />
          
          {/* 替换或上传状态 */}
          {uploadStatus === 'uploading' && replacingIndex === index ? (
            <View style={styles.uploadProgress}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.uploadProgressText}>
                替换中 {Math.round(uploadProgress)}%
              </Text>
            </View>
          ) : uploadStatus === 'uploading' && replacingIndex === undefined && index === referenceImages.length - 1 ? (
            /* 新添加图片的上传状态 */
            <View style={styles.uploadProgress}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.uploadProgressText}>
                上传中 {Math.round(uploadProgress)}%
              </Text>
            </View>
          ) : (
            /* 替换按钮 */
            <TouchableOpacity onPress={() => onReplaceImage(index)} style={{ flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
              <SvgIcon 
                width={16}
                height={16}
                uri="https://cdn-tos-cn.bytedance.net/obj/aipa-tos/d0bf5f34-5626-4160-841b-af6b5decb411/ic-loop.svg"
              />
              <Text style={[styles.replaceText, { marginTop: 4 }]}>替换</Text>
            </TouchableOpacity>
          )}
          
          {/* 删除按钮 */}
          <TouchableOpacity style={styles.removeButton} onPress={() => onRemoveImage(index)}>
            <View style={styles.removeButtonLine} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

// 默认导出一个带默认参考图的组件
export const ReferenceImageUploadWithDefault: React.FC<ReferenceImageUploadProps> & {
  getDefaultImages: () => string[];
} = (props) => {
  return <ReferenceImageUpload {...props} />;
};

ReferenceImageUploadWithDefault.getDefaultImages = () => [DEFAULT_REFERENCE_IMAGE];