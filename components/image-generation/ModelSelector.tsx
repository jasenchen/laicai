import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { volcanoImageService } from '@/services/volcanoImageService';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
}) => {
  const modelConfigs = volcanoImageService.getModelConfigs();
  const models = Object.values(modelConfigs);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>选择模型</Text>
      {models.map((model) => (
        <TouchableOpacity
          key={model.id}
          style={[
            styles.modelOption,
            selectedModel === model.id && styles.modelOptionSelected,
          ]}
          onPress={() => onModelChange(model.id)}
        >
          <View style={styles.modelInfo}>
            <Text style={[
              styles.modelName,
              selectedModel === model.id && styles.modelNameSelected,
            ]}>
              {model.name}
            </Text>
            <Text style={styles.modelDescription}>
              {model.description}
            </Text>
          </View>
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={selectedModel === model.id ? Colors.primary : Colors.border} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modelOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  modelInfo: {
    flex: 1,
    marginRight: 12,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  modelNameSelected: {
    color: Colors.primary,
  },
  modelDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});