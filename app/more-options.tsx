import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';

type GenerationOptions = {
  imageCount: number;
  streamEnabled: boolean;
  responseFormat: 'url' | 'b64_json';
};

export const DEFAULT_OPTIONS: GenerationOptions = {
  imageCount: 4,
  streamEnabled: true,
  responseFormat: 'url',
};

export default function MoreOptionsScreen() {
  const router = useRouter();
  const [imageCount, setImageCount] = useState<number>(DEFAULT_OPTIONS.imageCount);
  const [streamEnabled, setStreamEnabled] = useState<boolean>(DEFAULT_OPTIONS.streamEnabled);
  const [responseFormat, setResponseFormat] = useState<'url' | 'b64_json'>(DEFAULT_OPTIONS.responseFormat);
  
  const imageCounts = [1, 2, 3, 4];
  const responseFormats = [
    { value: 'url' as const, label: 'URL链接' },
    { value: 'b64_json' as const, label: 'Base64编码' },
  ];

  const handleSave = useCallback(async () => {
    try {
      // 保存配置到AsyncStorage
      const options: GenerationOptions = {
        imageCount,
        streamEnabled,
        responseFormat,
      };
      await AsyncStorage.setItem('poster_generation_options', JSON.stringify(options));
      
      router.back();
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  }, [imageCount, streamEnabled, responseFormat, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaContainer style={styles.container}>
      <BlurView intensity={80} style={styles.blurContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>更多选项</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>生图数量</Text>
              <View style={styles.optionButtonsContainer}>
                {imageCounts.map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.optionButton,
                      imageCount === count && styles.optionButtonSelected,
                    ]}
                    onPress={() => setImageCount(count)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        imageCount === count && styles.optionButtonTextSelected,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>输出格式</Text>
              <View style={styles.optionButtonsContainer}>
                {responseFormats.map((format) => (
                  <TouchableOpacity
                    key={format.value}
                    style={[
                      styles.optionButton,
                      styles.optionButtonLarge,
                      responseFormat === format.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => setResponseFormat(format.value)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        responseFormat === format.value && styles.optionButtonTextSelected,
                      ]}
                    >
                      {format.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>流式输出</Text>
              <View style={styles.optionSwitchContainer}>
                <TouchableOpacity
                  style={[
                    styles.switchTrack,
                    streamEnabled && styles.switchTrackActive,
                  ]}
                  onPress={() => setStreamEnabled(!streamEnabled)}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      streamEnabled && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
                <Text style={styles.optionDescription}>启用实时生成进度显示</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>保存配置</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </SafeAreaContainer>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurContainer: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 20,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '500',
  },
  optionsContainer: {
    flex: 1,
  },
  optionSection: {
    marginBottom: 24,
  },
  optionLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: Colors.text,
  },
  optionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonLarge: {
    flex: 1,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  optionSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: Colors.primary,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginLeft: 2,
  },
  switchThumbActive: {
    marginLeft: 22,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});