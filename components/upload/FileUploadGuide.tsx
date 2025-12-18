import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';
import { Colors } from '@/constants/Colors';

export const FileUploadGuide: React.FC = () => {
  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>文件上传使用指南</Text>
          <Text style={styles.subtitle}>了解如何在应用中使用文件上传功能</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本用法</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
{`import { FileUpload } from '@/components/upload/FileUpload';
import { UploadFile } from '@/types/upload';

const MyComponent = () => {
  const handleFilesChange = (files: UploadFile[]) => {
    console.log('上传的文件:', files);
  };

  return (
    <FileUpload
      multiple={false}
      maxFiles={1}
      maxSize={5 * 1024 * 1024}
      allowedTypes={['image/*']}
      onFilesChange={handleFilesChange}
    />
  );
};`}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>配置参数</Text>
          <View style={styles.parameterList}>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>multiple</Text>
              <Text style={styles.parameterDescription}>是否支持多文件选择</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>maxFiles</Text>
              <Text style={styles.parameterDescription}>最大文件数量</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>maxSize</Text>
              <Text style={styles.parameterDescription}>最大文件大小（字节）</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>allowedTypes</Text>
              <Text style={styles.parameterDescription}>允许的文件类型</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>showProgress</Text>
              <Text style={styles.parameterDescription}>是否显示上传进度</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>showPreview</Text>
              <Text style={styles.parameterDescription}>是否显示文件预览</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>回调函数</Text>
          <View style={styles.parameterList}>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>onFilesChange</Text>
              <Text style={styles.parameterDescription}>文件列表变化时触发</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>onUploadStart</Text>
              <Text style={styles.parameterDescription}>开始上传时触发</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>onUploadComplete</Text>
              <Text style={styles.parameterDescription}>上传完成时触发</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterName}>onUploadError</Text>
              <Text style={styles.parameterDescription}>上传失败时触发</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>使用Hook</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
{`import { useFileUpload } from '@/hooks/useFileUpload';

const MyComponent = () => {
  const {
    selectFiles,
    takePhoto,
    files,
    status,
    progress,
    isLoading
  } = useFileUpload({
    maxFiles: 1,
    allowedTypes: ['image/*'],
    onSuccess: (files) => {
      console.log('上传成功:', files);
    }
  });

  return (
    <View>
      <TouchableOpacity onPress={selectFiles}>
        <Text>选择文件</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={takePhoto}>
        <Text>拍照上传</Text>
      </TouchableOpacity>
    </View>
  );
};`}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>注意事项</Text>
          <View style={styles.noteList}>
            <Text style={styles.noteItem}>• 文件上传使用AIPA官方TOS存储服务</Text>
            <Text style={styles.noteItem}>• 支持Web和移动端跨平台使用</Text>
            <Text style={styles.noteItem}>• 图片上传会自动压缩以提高上传速度</Text>
            <Text style={styles.noteItem}>• 支持进度回调和错误处理</Text>
            <Text style={styles.noteItem}>• 移动端会自动请求相机和相册权限</Text>
          </View>
        </View>

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
  subtitle: {
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
  codeBlock: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  codeText: {
    fontSize: 12,
    color: '#d4d4d4',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  parameterList: {
    gap: 12,
  },
  parameterItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  parameterName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  parameterDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noteList: {
    gap: 8,
  },
  noteItem: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    paddingLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});