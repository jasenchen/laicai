import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { fileUploadService } from '@/services/fileUploadService';
import { ImagePickerAsset } from '@/types/upload';
import { Colors } from '@/constants/Colors';

interface TestResult {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

export default function FileUploadTestScreen() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const addResult = (type: 'success' | 'error' | 'info', message: string) => {
    const result: TestResult = {
      type,
      message,
      timestamp: new Date(),
    };
    
    setTestResults(prev => [...prev, result]);
    
    // 自动滚动到底部
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const clearResults = () => {
    setTestResults([]);
    setUploadedFiles([]);
  };

  // 测试1: 上传单个文件
  const testSingleFileUpload = async () => {
    try {
      setIsLoading(true);
      addResult('info', '🔍 开始测试: 上传单个文件');

      // 选择文件
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        addResult('info', '❌ 用户取消了文件选择');
        return;
      }

      const asset = result.assets[0];
      addResult('info', `📄 选择了文件: ${asset.name} (${asset.size} bytes)`);

      // 创建ImagePickerAsset格式的对象
      const imageAsset: ImagePickerAsset = {
        uri: asset.uri,
        fileName: asset.name,
        fileSize: asset.size || 0,
        mimeType: asset.mimeType || 'application/octet-stream',
        type: 'image', // 默认设为image
        width: 0,
        height: 0,
      };

      // 上传文件
      const uploadUrl = await fileUploadService.uploadFileSimple(imageAsset);
      
      addResult('success', `✅ 文件上传成功! URL: ${uploadUrl}`);
      setUploadedFiles(prev => [...prev, uploadUrl]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addResult('error', `❌ 文件上传失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试2: 上传图片文件
  const testImageUpload = async () => {
    try {
      setIsLoading(true);
      addResult('info', '🔍 开始测试: 上传图片文件');

      // 请求相机权限
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        addResult('error', '❌ 需要相册权限才能选择图片');
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        addResult('info', '❌ 用户取消了图片选择');
        return;
      }

      const imageAsset = result.assets[0];
      const imageUri = imageAsset.uri;
      addResult('info', `🖼️ 选择了图片: ${imageUri}`);
      addResult('info', `📋 图片信息: ${imageAsset.fileName || '未知'} (${imageAsset.fileSize || 0} bytes)`);

      // 上传文件
      const uploadUrl = await fileUploadService.uploadFileSimple(imageAsset);
      
      addResult('success', `✅ 图片上传成功! URL: ${uploadUrl}`);
      setUploadedFiles(prev => [...prev, uploadUrl]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addResult('error', `❌ 图片上传失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试3: 通过URL上传图片
  const testUrlUpload = async () => {
    if (!imageUrl.trim()) {
      Alert.alert('请输入图片URL');
      return;
    }

    try {
      setIsLoading(true);
      addResult('info', `🔍 开始测试: 通过URL上传图片`);

      // 通过URL上传
      const uploadUrl = await fileUploadService.uploadImageFromUrl(imageUrl.trim());
      
      addResult('success', `✅ URL图片上传成功! URL: ${uploadUrl}`);
      setUploadedFiles(prev => [...prev, uploadUrl]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addResult('error', `❌ URL图片上传失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试4: 批量上传
  const testBatchUpload = async () => {
    try {
      setIsLoading(true);
      addResult('info', '🔍 开始测试: 批量上传图片');

      // 测试用的图片URL数组
      const testUrls = [
        'https://cdn-tos-cn.bytedance.net/obj/aipa-tos/29a1463b-cc69-4aa9-b20d-5cf55ebc6584/bic-huodong.png',
        'https://cdn-tos-cn.bytedance.net/obj/aipa-tos/833205a4-ab96-4a85-a1bf-c875abe7c301/bic-haibao.png',
        'https://cdn-tos-cn.bytedance.net/obj/aipa-tos/db00d96b-392d-4c84-9162-79fc9aa11044/bic-caidan.png',
      ];

      addResult('info', `📦 准备批量上传 ${testUrls.length} 张图片`);

      // 批量上传
      const uploadUrls = await fileUploadService.uploadMultipleImages(testUrls);
      
      addResult('success', `✅ 批量上传完成! 成功上传 ${uploadUrls.length} 张图片`);
      uploadUrls.forEach((url, index) => {
        addResult('info', `  📸 图片${index + 1}: ${url}`);
      });
      
      setUploadedFiles(prev => [...prev, ...uploadUrls]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addResult('error', `❌ 批量上传失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试5: 配置检查
  const testConfigCheck = () => {
    addResult('info', '🔍 开始测试: 配置检查');
    
    const apiDomain = process.env.EXPO_PUBLIC_AIPA_API_DOMAIN || process.env.AIPA_API_DOMAIN;
    if (apiDomain) {
      addResult('success', `✅ API域名配置: ${apiDomain}`);
    } else {
      addResult('error', '❌ API域名未配置');
    }
    
    const uploadURL = apiDomain ? `${apiDomain}/api/file-upload` : '/api/file-upload';
    addResult('info', `📡 上传端点: ${uploadURL}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AIPA文件上传测试</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 测试按钮区域 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testSingleFileUpload}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>测试1: 选择文件上传</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testImageUpload}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>测试2: 选择图片上传</Text>
          </TouchableOpacity>

          <View style={styles.urlInputSection}>
            <TextInput
              style={styles.urlInput}
              placeholder="输入图片URL进行测试"
              value={imageUrl}
              onChangeText={setImageUrl}
              multiline
            />
            <TouchableOpacity
              style={styles.testButton}
              onPress={testUrlUpload}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>测试3: URL图片上传</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testBatchUpload}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>测试4: 批量上传测试</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testConfigCheck}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>测试5: 配置检查</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.clearButton]}
            onPress={clearResults}
            disabled={isLoading}
          >
            <Text style={styles.clearButtonText}>清空结果</Text>
          </TouchableOpacity>
        </View>

        {/* 上传的文件展示 */}
        {uploadedFiles.length > 0 && (
          <View style={styles.uploadedSection}>
            <Text style={styles.sectionTitle}>上传的文件:</Text>
            {uploadedFiles.map((url, index) => (
              <View key={index} style={styles.uploadedItem}>
                {url.includes('image') ? (
                  <Image source={{ uri: url }} style={styles.uploadedImage} />
                ) : (
                  <Text style={styles.uploadedText} numberOfLines={2}>{url}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 测试结果展示 */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>测试结果:</Text>
            <Text style={styles.resultsCount}>共 {testResults.length} 条</Text>
          </View>
          
          {testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                result.type === 'success' && styles.successResult,
                result.type === 'error' && styles.errorResult,
                result.type === 'info' && styles.infoResult,
              ]}
            >
              <Text style={styles.resultText}>{result.message}</Text>
              <Text style={styles.resultTime}>
                {result.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>

        {/* 加载指示器 */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>正在测试中...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  buttonSection: {
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: Colors.text,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  urlInputSection: {
    marginBottom: 12,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
    backgroundColor: 'white',
    minHeight: 60,
  },
  uploadedSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  uploadedItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadedImage: {
    width: '100%',
    height: 150,
    borderRadius: 4,
    resizeMode: 'contain',
  },
  uploadedText: {
    fontSize: 12,
    color: Colors.text,
  },
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.7,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  successResult: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  errorResult: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  infoResult: {
    backgroundColor: '#d1ecf1',
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  resultTime: {
    fontSize: 12,
    color: Colors.text,
    opacity: 0.6,
    marginTop: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
});
