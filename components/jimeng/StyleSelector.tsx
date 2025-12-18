import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { JimengStyleOption } from '@/types/jimeng';

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleSelect: (styleId: string) => void;
}

const styleOptions: JimengStyleOption[] = [
  { id: 'vivid', name: '生动', description: '色彩鲜艳，细节丰富' },
  { id: 'natural', name: '自然', description: '自然真实，色彩柔和' },
  { id: 'artistic', name: '艺术', description: '艺术风格，创意独特' },
  { id: 'anime', name: '动漫', description: '动漫风格，二次元' },
  { id: 'realistic', name: '写实', description: '超写实，照片级' },
  { id: 'watercolor', name: '水彩', description: '水彩画风格，柔和流动' },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onStyleSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>风格选择</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {styleOptions.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styles.styleOption,
              selectedStyle === style.id && styles.selectedOption,
            ]}
            onPress={() => onStyleSelect(style.id)}
          >
            <Text style={[
              styles.styleName,
              selectedStyle === style.id && styles.selectedText,
            ]}>
              {style.name}
            </Text>
            <Text style={[
              styles.styleDescription,
              selectedStyle === style.id && styles.selectedDescription,
            ]}>
              {style.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  styleOption: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedText: {
    color: 'white',
  },
  styleDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});