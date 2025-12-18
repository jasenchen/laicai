import React, { useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';

interface PromptInputProps {
  dishName: string;
  onDishNameChange: (dishName: string) => void;
  placeholder?: string; // 动态占位符
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 12,
    minHeight: 100,
    width: '100%'
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
    textAlignVertical: 'top',
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 80,
    width: '100%'
  },
});

export const PromptInput: React.FC<PromptInputProps> = ({
  dishName,
  onDishNameChange,
  placeholder = "输入菜品名称，如：锅包肉、红烧肉、麻婆豆腐"
}) => {
  const inputRef = useRef<TextInput>(null);
  return (
    <Pressable style={styles.container} onPress={() => inputRef.current?.focus()}>
      <TextInput
        ref={inputRef}
        style={styles.textInput}
        value={dishName}
        onChangeText={onDishNameChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.35)"
        multiline
        scrollEnabled={false}
        maxLength={50}
        textAlignVertical="top"
      />
    </Pressable>
  );
};
