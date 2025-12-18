import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';
import { ImageViewer } from '@/components/ui/ImageViewer';
import { useFileUpload } from '@/hooks/useFileUpload';
import { 
  volcanoImageService, 
  VolcanoImageGenerationRequest, 
  VolcanoImageGenerationResponse 
} from '@/services/volcanoImageService';
import { Colors } from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

// 尺寸映射函数 - 根据模型动态显示
const getSizeDisplayName = (size: string): string => {
  switch (size) {
    case '3:4':
      return '3:4';
    case '9:16':
      return '9:16';
    case '1:1':
      return '1:1';
    default:
      return size;
  }
};

const getSizeDescription = (size: string, model: string): string => {
  // SeedDream 3.0 模型的尺寸参数
  if (model === 'doubao-seedream-3-0-t2i-250415') {
    switch (size) {
      case '3:4':
        return '768×1024';
      case '9:16':
        return '576×1024';
      case '1:1':
        return '1024×1024';
      default:
        return '';
    }
  }
  
  // SeedDream 4.0 模型的尺寸参数
  switch (size) {
    case '3:4':
      return '1728×2304';
    case '9:16':
      return '1440×2560';
    case '1:1':
      return '2048×2048';
    default:
      return '';
  }
};

export default function ImageGenerationScreen() {
  const [prompt, setPrompt] = useState('生成一个海报，精致写实风格，色彩鲜明饱满；海报中心主体为：参考图，并适当优化参考图的光影与质感，根据参考图的内容，提炼出海报标题文案和副标题文案，标题文案不超过10个字，并用文案生成美观的艺术字体做外海报标题元素。增加文案：尝鲜价"19.9"，品牌信息："喜六爷·XILIUYE"，画面有故事感，大师级排版，整体营造有吸引力且美观的海报氛围；商业摄影风格，标题位于海报中心上方，小标题在下方，8k，最佳画质。');
  const [selectedModel, setSelectedModel] = useState('doubao-seedream-4-0-250828');
  const [selectedSize, setSelectedSize] = useState('3:4');
  const [watermark, setWatermark] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // 获取模型配置
  const modelConfigs = volcanoImageService.getModelConfigs();
  
  // 获取当前选中的模型配置
  const getCurrentModelConfig = () => {
    switch (selectedModel) {
      case 'doubao-seedream-3-0-t2i-250415':
        return modelConfigs.seedream3;
      case 'doubao-seedream-4-0-250828':
      default:
        return modelConfigs.seedream4;
    }
  };

  const currentModelConfig = getCurrentModelConfig();

  const { 
    selectFiles, 
    takePhoto,
    status: uploadStatus, 
    progress: uploadProgress 
  } = useFileUpload({
    maxFiles: 4,
    allowedTypes: ['image/*'],
    onSuccess: (files) => {
      const imageUrls = files.map(file => file.url);
      setReferenceImages(prev => [...prev, ...imageUrls].slice(0, 4));
      console.log('[ImageGeneration] 参考图片上传成功:', imageUrls);
    },
    onError: (error) => {
      Alert.alert('上传失败', error.message);
    }
  });

  const handleGenerateImages = useCallback(async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入图片描述');
      return;
    }

    // 验证请求参数
    const request: VolcanoImageGenerationRequest = {
      model: selectedModel,
      prompt: prompt.trim(),
      image: referenceImages.length > 0 ? referenceImages : undefined,
      size: selectedSize as "3:4" | "9:16" | "1:1",
      watermark: watermark,
      sequential_image_generation: 'auto',
      sequential_image_generation_options: {
        max_images: 1
      }
    };

    const validation = volcanoImageService.validateRequest(request);
    if (!validation.valid) {
      Alert.alert('参数错误', validation.errors.join('\n'));
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      console.log('[ImageGeneration] 开始生成图片:', request);
      
      const response: VolcanoImageGenerationResponse = 
        await volcanoImageService.generateImages(request, {
          onProgress: (loaded, total) => {
            console.log(`[ImageGeneration] 生成进度: ${loaded}/${total}`);
          }
        });

      if (response.data && response.data.length > 0) {
        const newImages = response.data
          .filter(item => item.url)
          .map(item => item.url!);
        
        setGeneratedImages(newImages);
        console.log('[ImageGeneration] 图片生成成功:', newImages);
        
        Alert.alert(
          '生成成功', 
          `已生成 ${newImages.length} 张图片`,
          [{ text: '确定' }]
        );
      } else {
        Alert.alert('生成失败', '未收到生成的图片');
      }
    } catch (error) {
      console.error('[ImageGeneration] 生成失败:', error);
      Alert.alert('生成失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, selectedSize, watermark, referenceImages]);

  const handleAddReferenceImage = useCallback(() => {
    if (referenceImages.length >= 4) {
      Alert.alert('提示', '最多支持4张参考图片');
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
  }, [referenceImages.length, takePhoto, selectFiles]);

  const handleRemoveReferenceImage = useCallback((index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleImagePress = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageViewer(true);
  }, []);

  const handleImageViewerClose = useCallback(() => {
    setShowImageViewer(false);
    setSelectedImage(null);
  }, []);

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.title}>图生图创作</Text>
          <Text style={styles.subtitle}>基于火山引擎AI技术</Text>
        </View>

        {/* 模型选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择模型</Text>
          <View style={styles.modelOptions}>
            <TouchableOpacity
              style={[
                styles.modelOption,
                selectedModel === 'doubao-seedream-4-0-250828' && styles.modelOptionSelected
              ]}
              onPress={() => setSelectedModel('doubao-seedream-4-0-250828')}
            >
              <View style={styles.modelOptionContent}>
                <Text style={[
                  styles.modelOptionName,
                  selectedModel === 'doubao-seedream-4-0-250828' && styles.modelOptionTextSelected
                ]}>
                  {modelConfigs.seedream4.name}
                </Text>
                <Text style={[
                  styles.modelOptionDescription,
                  selectedModel === 'doubao-seedream-4-0-250828' && styles.modelOptionTextSelected
                ]}>
                  {modelConfigs.seedream4.description}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modelOption,
                selectedModel === 'doubao-seedream-3-0-t2i-250415' && styles.modelOptionSelected
              ]}
              onPress={() => setSelectedModel('doubao-seedream-3-0-t2i-250415')}
            >
              <View style={styles.modelOptionContent}>
                <Text style={[
                  styles.modelOptionName,
                  selectedModel === 'doubao-seedream-3-0-t2i-250415' && styles.modelOptionTextSelected
                ]}>
                  {modelConfigs.seedream3.name}
                </Text>
                <Text style={[
                  styles.modelOptionDescription,
                  selectedModel === 'doubao-seedream-3-0-t2i-250415' && styles.modelOptionTextSelected
                ]}>
                  {modelConfigs.seedream3.description}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 参考图片 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>参考图片</Text>
            <Text style={styles.sectionSubtitle}>
              ({referenceImages.length}/4)
            </Text>
          </View>
          
          {referenceImages.length > 0 ? (
            <View style={styles.referenceImagesGrid}>
              {referenceImages.map((imageUrl, index) => (
                <View key={index} style={styles.referenceImageContainer}>
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.referenceImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveReferenceImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {referenceImages.length < 4 && (
                <TouchableOpacity 
                  style={styles.addImageButton}
                  onPress={handleAddReferenceImage}
                  disabled={uploadStatus === 'uploading'}
                >
                  <Ionicons name="add" size={24} color={Colors.primary} />
                  {uploadStatus === 'uploading' && (
                    <View style={styles.uploadProgress}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.uploadProgressText}>
                        {Math.round(uploadProgress)}%
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addImagePlaceholder}
              onPress={handleAddReferenceImage}
              disabled={uploadStatus === 'uploading'}
            >
              <Ionicons name="camera" size={32} color={Colors.textSecondary} />
              <Text style={styles.addImageText}>
                添加参考图片（拍照或相册选择）
              </Text>
              <Text style={styles.addImageSubText}>
                最多支持4张图片
              </Text>
              {uploadStatus === 'uploading' && (
                <View style={styles.uploadProgress}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.uploadProgressText}>
                    上传中 {Math.round(uploadProgress)}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 描述输入 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>图片描述</Text>
          <TextInput
            style={styles.promptInput}
            placeholder="请描述你想要生成的图片..."
            placeholderTextColor={Colors.textSecondary}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {prompt.length}/1000
          </Text>
        </View>

        {/* 参数设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>参数设置</Text>
          
          <View style={styles.parameterRow}>
            <Text style={styles.parameterLabel}>图片尺寸</Text>
            <View style={styles.sizeOptions}>
              {currentModelConfig.supportedSizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeOption,
                    selectedSize === size && styles.sizeOptionSelected
                  ]}
                  onPress={() => setSelectedSize(size)}
                >
                  <View style={styles.sizeOptionContent}>
                    <Text style={[
                      styles.sizeOptionRatio,
                      selectedSize === size && styles.sizeOptionTextSelected
                    ]}>
                      {getSizeDisplayName(size)}
                    </Text>
                    <Text style={[
                      styles.sizeOptionDescription,
                      selectedSize === size && styles.sizeOptionTextSelected
                    ]}>
                      {getSizeDescription(size, selectedModel)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.parameterRow}>
            <Text style={styles.parameterLabel}>添加水印</Text>
            <TouchableOpacity
              style={[styles.switch, watermark && styles.switchEnabled]}
              onPress={() => setWatermark(!watermark)}
            >
              <View style={[
                styles.switchThumb,
                watermark && styles.switchThumbEnabled
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 生成按钮 */}
        <TouchableOpacity 
          style={[
            styles.generateButton,
            isGenerating && styles.generateButtonDisabled
          ]}
          onPress={handleGenerateImages}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <View style={styles.generatingContent}>
              <ActivityIndicator size="small" color={Colors.surface} />
              <Text style={styles.generateButtonText}>生成中...</Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>生成图片</Text>
          )}
        </TouchableOpacity>

        {/* 生成结果 */}
        {generatedImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>生成结果</Text>
            <View style={styles.resultsGrid}>
              {generatedImages.map((imageUrl, index) => (
                <View key={index} style={styles.resultContainer}>
                  <TouchableOpacity onPress={() => handleImagePress(imageUrl)}>
                    <Image 
                      source={{ uri: imageUrl }} 
                      style={styles.resultImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton}>
                    <Ionicons name="download" size={16} color={Colors.surface} />
                    <Text style={styles.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 底部间距 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      <ImageViewer
        visible={showImageViewer}
        imageUrl={selectedImage}
        onClose={handleImageViewerClose}
        title="生成的图片"
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modelOptions: {
    gap: 8,
  },
  modelOption: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modelOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modelOptionContent: {
    alignItems: 'flex-start',
  },
  modelOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  modelOptionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modelOptionTextSelected: {
    color: Colors.surface,
  },
  sizeOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  sizeOptionTextSelected: {
    color: Colors.surface,
  },
  referenceImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  referenceImageContainer: {
    position: 'relative',
    width: (screenWidth - 64) / 4,
    height: (screenWidth - 64) / 4,
  },
  referenceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  addImageButton: {
    width: (screenWidth - 64) / 4,
    height: (screenWidth - 64) / 4,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addImagePlaceholder: {
    padding: 32,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  addImageSubText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  uploadProgress: {
    alignItems: 'center',
    marginTop: 8,
  },
  uploadProgressText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  promptInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  parameterLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  sizeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
  },
  sizeOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sizeOptionContent: {
    alignItems: 'center',
  },
  sizeOptionRatio: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  sizeOptionDescription: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  switch: {
    width: 48,
    height: 28,
    backgroundColor: Colors.border,
    borderRadius: 14,
    justifyContent: 'center',
  },
  switchEnabled: {
    backgroundColor: Colors.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  switchThumbEnabled: {
    alignSelf: 'flex-end',
  },
  generateButton: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonDisabled: {
    backgroundColor: Colors.border,
  },
  generatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
  resultsGrid: {
    gap: 16,
  },
  resultContainer: {
    gap: 8,
  },
  resultImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.surface,
  },
  bottomSpacer: {
    height: 20,
  },
});