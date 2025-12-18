import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';
import { FileUpload } from './FileUpload';
import { UploadFile } from '@/types/upload';
import { Colors } from '@/constants/Colors';

interface FileUploadExampleProps {
  title?: string;
  description?: string;
}

export const FileUploadExample: React.FC<FileUploadExampleProps> = ({
  title = '文件上传示例',
  description = '演示文件上传功能的使用',
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);

  const handleFilesChange = (files: UploadFile[]) => {
    setUploadedFiles(files);
    console.log('[FileUploadExample] 文件列表更新:', files.length, '个文件');
  };

  const handleUploadStart = () => {
    console.log('[FileUploadExample] 开始上传');
  };

  const handleUploadComplete = (files: UploadFile[]) => {
    console.log('[FileUploadExample] 上传完成:', files);
    Alert.alert('上传成功', `成功上传 ${files.length} 个文件`);
  };

  const handleUploadError = (error: Error) => {
    console.error('[FileUploadExample] 上传失败:', error);
  };

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>单文件上传</Text>
          <FileUpload
            multiple={false}
            maxFiles={1}
            maxSize={5 * 1024 * 1024}
            allowedTypes={['image/*']}
            showProgress={true}
            showPreview={true}
            onFilesChange={handleFilesChange}
            onUploadStart={handleUploadStart}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>多文件上传</Text>
          <FileUpload
            multiple={true}
            maxFiles={4}
            maxSize={10 * 1024 * 1024}
            allowedTypes={['image/*', 'application/pdf']}
            showProgress={true}
            showPreview={true}
            onFilesChange={(files) => {
              console.log('[FileUploadExample] 多文件上传:', files.length);
            }}
          />
        </View>

        {uploadedFiles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>上传结果</Text>
            {uploadedFiles.map((file, index) => (
              <View key={index} style={styles.fileResult}>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileInfo}>
                  大小: {(file.size / 1024 / 1024).toFixed(2)} MB | 
                  类型: {file.type}
                </Text>
                <Text style={styles.fileUrl} numberOfLines={1}>
                  URL: {file.url}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaContainer>
  );
};

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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  fileResult: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  fileInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  fileUrl: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  bottomSpacer: {
    height: 20,
  },
});