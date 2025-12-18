import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { JimengSizeOption } from '@/types/jimeng';

interface SizeSelectorProps {
  selectedSize: string;
  onSizeSelect: (sizeId: string) => void;
}

const sizeOptions: JimengSizeOption[] = [
  { id: '512x512', name: '512×512', width: 512, height: 512 },
  { id: '768x768', name: '768×768', width: 768, height: 768 },
  { id: '1024x1024', name: '1K', width: 1024, height: 1024 },
  { id: '1024x1792', name: '竖版', width: 1024, height: 1792 },
  { id: '1792x1024', name: '横版', width: 1792, height: 1024 },
  { id: '2048x2048', name: '2K', width: 2048, height: 2048 },
];

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  selectedSize,
  onSizeSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>尺寸选择</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {sizeOptions.map((size) => (
          <TouchableOpacity
            key={size.id}
            style={[
              styles.sizeOption,
              selectedSize === size.id && styles.selectedOption,
            ]}
            onPress={() => onSizeSelect(size.id)}
          >
            <Text style={[
              styles.sizeName,
              selectedSize === size.id && styles.selectedText,
            ]}>
              {size.name}
            </Text>
            <Text style={[
              styles.sizeDescription,
              selectedSize === size.id && styles.selectedDescription,
            ]}>
              {size.width}×{size.height}
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
  sizeOption: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sizeName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedText: {
    color: 'white',
  },
  sizeDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});