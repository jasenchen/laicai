import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';
import { authService } from '@/services/authService';
import { Colors } from '@/constants/Colors';

export default function AuthDebugScreen() {
  const [phones, setPhones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPhones();
  }, []);

  const loadPhones = async () => {
    try {
      setIsLoading(true);
      const result = await authService.getAllUserPhones();
      if (result.success && result.data) {
        setPhones(result.data);
      }
    } catch (error) {
      console.error('[AuthDebug] 加载手机号失败:', error);
      Alert.alert('错误', '加载手机号失败');
    } finally {
      setIsLoading(false);
    }
  };

  const initPhones = async () => {
    try {
      setIsLoading(true);
      const result = await authService.initUserPhones();
      Alert.alert('结果', result.message);
      if (result.success) {
        loadPhones(); // 重新加载
      }
    } catch (error) {
      console.error('[AuthDebug] 初始化手机号失败:', error);
      Alert.alert('错误', '初始化手机号失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaContainer style={styles.container}>
      <Text style={styles.title}>认证调试页面</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={initPhones} disabled={isLoading}>
          <Text style={styles.buttonText}>初始化手机号</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={loadPhones} disabled={isLoading}>
          <Text style={styles.buttonText}>刷新手机号</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.phoneContainer}>
        <Text style={styles.subtitle}>现有手机号：</Text>
        {phones.map((phone, index) => (
          <View key={index} style={styles.phoneItem}>
            <Text style={styles.phoneText}>{phone.phone}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  phoneContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  phoneItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
});