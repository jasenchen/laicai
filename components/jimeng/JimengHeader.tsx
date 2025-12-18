import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';
import { Colors } from '@/constants/Colors';
import { JimengStyleOption, JimengSizeOption } from '@/types/jimeng';

interface JimengHeaderProps {
  title: string;
  onBack?: () => void;
  showHistory?: boolean;
  onHistoryPress?: () => void;
}

export const JimengHeader: React.FC<JimengHeaderProps> = ({
  title,
  onBack,
  showHistory = true,
  onHistoryPress,
}) => {
  return (
    <SafeAreaContainer style={styles.container} excludeEdges={['bottom']}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
        {showHistory && onHistoryPress && (
          <TouchableOpacity onPress={onHistoryPress} style={styles.historyButton}>
            <Ionicons name="time-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  historyButton: {
    padding: 8,
    borderRadius: 8,
  },
});