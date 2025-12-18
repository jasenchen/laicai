import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFileUpload } from '@/hooks/useFileUpload';
import { UploadFile, FileUploadProps } from '@/types/upload';
import { Colors } from '@/constants/Colors';

export const FileUpload: React.FC<FileUploadProps> = ({
  multiple = false,
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024,
  allowedTypes = ['image/*'],
  showProgress = true,
  showPreview = true,
  onFilesChange,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    selectFiles,
    takePhoto,
    clearFiles,
    files,
    status,
    error,
    progress,
    isLoading,
  } = useFileUpload({
    maxFiles,
    maxSize,
    allowedTypes,
    onSuccess: (uploadedFiles) => {
      onFilesChange?.(uploadedFiles);
      onUploadComplete?.(uploadedFiles);
      setIsExpanded(uploadedFiles.length > 0);
    },
    onError: (uploadError) => {
      onUploadError?.(uploadError);
      Alert.alert('上传失败', uploadError.message);
    },
  });

  const handleSelectFiles = useCallback(() => {
    onUploadStart?.();
    if (Platform.OS === 'web' || !allowedTypes.includes('image/*')) {
      selectFiles();
    } else {
      Alert.alert(
        '选择文件',
        '请选择获取图片的方式',
        [
          {
            text: '相册',
            onPress: selectFiles,
          },
          {
            text: '拍照',
            onPress: takePhoto,
          },
          {
            text: '取消',
            style: 'cancel',
          },
        ]
      );
    }
  }, [selectFiles, takePhoto, allowedTypes, onUploadStart]);

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange?.(newFiles);
    if (newFiles.length === 0) {
      setIsExpanded(false);
    }
  }, [files, onFilesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): any => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'videocam';
    if (type.startsWith('audio/')) return 'musical-notes';
    if (type.includes('pdf')) return 'document-text';
    return 'document';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.uploadArea,
          isExpanded && styles.uploadAreaExpanded,
          error && styles.uploadAreaError,
        ]}
        onPress={handleSelectFiles}
        disabled={isLoading}
      >
        <View style={styles.uploadContent}>
          {isLoading ? (
            <View style={styles.loadingContent}>
              <Ionicons name="cloud-upload" size={48} color={Colors.primary} />
              <Text style={styles.uploadingText}>上传中...</Text>
              {showProgress && (
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%` }
                    ]} 
                  />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.defaultContent}>
              <Ionicons name="cloud-upload-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.uploadText}>
                {multiple ? '选择文件' : '选择文件'}
              </Text>
              <Text style={styles.uploadHint}>
                {allowedTypes.includes('image/*') ? '支持图片格式' : '支持指定格式'}
                {' • '}
                最大 {formatFileSize(maxSize)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}

      {showPreview && files.length > 0 && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              已选择 {files.length} 个文件
            </Text>
            <TouchableOpacity onPress={clearFiles} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
              <Text style={styles.clearText}>清空</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.fileList}
          >
            {files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                {file.type.startsWith('image/') ? (
                  <Image 
                    source={{ uri: file.url }} 
                    style={styles.fileImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.fileIcon}>
                    <Ionicons 
                      name={getFileIcon(file.type)} 
                      size={24} 
                      color={Colors.textSecondary} 
                    />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFile(index)}
                >
                  <Ionicons name="close" size={12} color={Colors.surface} />
                </TouchableOpacity>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {formatFileSize(file.size)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  uploadArea: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadAreaExpanded: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  uploadAreaError: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}08`,
  },
  uploadContent: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  defaultContent: {
    alignItems: 'center',
    gap: 8,
  },
  loadingContent: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  uploadHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: `${Colors.error}10`,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    flex: 1,
  },
  previewContainer: {
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearText: {
    fontSize: 14,
    color: Colors.error,
  },
  fileList: {
    gap: 12,
  },
  fileItem: {
    position: 'relative',
    width: 100,
    gap: 8,
  },
  fileImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  fileIcon: {
    width: 100,
    height: 100,
    backgroundColor: Colors.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    gap: 2,
  },
  fileName: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});