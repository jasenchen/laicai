import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';

interface ApiKeyConfigProps {
  visible: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey?: string;
}

export const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({
  visible,
  onClose,
  onSave,
  currentApiKey = '',
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    setApiKey(currentApiKey);
  }, [currentApiKey]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('错误', '请输入API Key');
      return;
    }

    // 基本格式验证
    if (!apiKey.startsWith('ak-') && !apiKey.startsWith('sk-')) {
      Alert.alert('提示', 'API Key格式可能不正确，请确认后继续保存');
    }

    setIsValidating(true);
    try {
      await onSave(apiKey.trim());
      onClose();
      Alert.alert('成功', 'API Key已保存');
    } catch (error) {
      Alert.alert('错误', '保存API Key失败');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      '确认',
      '确定要清除API Key吗？清除后将无法使用即梦AI功能。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            setApiKey('');
            onSave('');
            onClose();
            Alert.alert('成功', 'API Key已清除');
          },
        },
      ]
    );
  };

  const renderApiKeyInput = () => (
    <View style={styles.inputSection}>
      <Text style={styles.label}>API Key</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="请输入即梦AI的API Key"
          placeholderTextColor={Colors.textSecondary}
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry={!showApiKey}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={() => setShowApiKey(!showApiKey)}
        >
          <Ionicons
            name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        API Key通常以 "ak-" 或 "sk-" 开头，请从即梦AI控制台获取
      </Text>
    </View>
  );

  const renderInstructions = () => (
    <View style={styles.instructionsSection}>
      <Text style={styles.sectionTitle}>如何获取API Key</Text>
      <ScrollView style={styles.instructionsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionItem}>
          <Ionicons name="radio-button-on" size={16} color={Colors.primary} />
          <Text style={styles.instructionText}>
            访问即梦AI控制台：https://console.volcengine.com/jimeng
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="radio-button-on" size={16} color={Colors.primary} />
          <Text style={styles.instructionText}>
            注册并登录您的火山引擎账号
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="radio-button-on" size={16} color={Colors.primary} />
          <Text style={styles.instructionText}>
            进入"API密钥管理"页面
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="radio-button-on" size={16} color={Colors.primary} />
          <Text style={styles.instructionText}>
            点击"创建密钥"生成新的API Key
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="radio-button-on" size={16} color={Colors.primary} />
          <Text style={styles.instructionText}>
            复制生成的API Key并粘贴到此处
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsSection}>
      {currentApiKey && (
        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClear}
          disabled={isValidating}
        >
          <Text style={styles.clearButtonText}>清除密钥</Text>
        </TouchableOpacity>
      )}
      <View style={styles.primaryActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={onClose}
          disabled={isValidating}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton, isValidating && styles.disabledButton]}
          onPress={handleSave}
          disabled={isValidating}
        >
          <Text style={styles.saveButtonText}>
            {isValidating ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaContainer style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>API Key配置</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderApiKeyInput()}
          {renderInstructions()}
          {renderActions()}
        </ScrollView>
      </SafeAreaContainer>
    </Modal>
  );
};

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
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    paddingRight: 48,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  visibilityButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 16,
  },
  instructionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  instructionsScroll: {
    maxHeight: 200,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actionsSection: {
    paddingBottom: 32,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
});