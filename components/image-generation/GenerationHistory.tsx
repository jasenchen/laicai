import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { GenerationHistory } from '@/types/volcano';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';
import { ImageViewer } from '@/components/ui/ImageViewer';

interface GenerationHistoryProps {
  history: GenerationHistory[];
  onDeleteHistory?: (id: string) => void;
  onRetryGeneration?: (history: GenerationHistory) => void;
}

export const GenerationHistoryComponent: React.FC<GenerationHistoryProps> = ({
  history,
  onDeleteHistory,
  onRetryGeneration,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageViewer(true);
  };

  const handleImageViewerClose = () => {
    setShowImageViewer(false);
    setSelectedImage(null);
  };

  if (history.length === 0) {
    return (
      <SafeAreaContainer>
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyText}>暂无生成历史</Text>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {history.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <View style={styles.historyInfo}>
                <Text style={styles.promptText} numberOfLines={2}>
                  {item.prompt}
                </Text>
                <Text style={styles.dateText}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              <View style={styles.historyActions}>
                {item.status === 'failed' && onRetryGeneration && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onRetryGeneration(item)}
                  >
                    <Ionicons name="refresh" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}
                {onDeleteHistory && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onDeleteHistory(item.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {item.status === 'generating' && (
              <View style={styles.generatingContainer}>
                <Ionicons name="refresh" size={20} color={Colors.primary} />
                <Text style={styles.generatingText}>生成中...</Text>
              </View>
            )}
            
            {item.status === 'failed' && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.errorText}>
                  {item.error || '生成失败'}
                </Text>
              </View>
            )}
            
            {item.status === 'completed' && item.generatedImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imagesContainer}>
                  {item.generatedImages.map((imageUrl, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleImagePress(imageUrl)}
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.historyImage}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      <ImageViewer
        visible={showImageViewer}
        imageUrl={selectedImage}
        onClose={handleImageViewerClose}
        title="历史图片"
      />
    </SafeAreaContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  historyItem: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyInfo: {
    flex: 1,
    marginRight: 12,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: `${Colors.border}20`,
    borderRadius: 6,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 8,
  },
  generatingText: {
    fontSize: 14,
    color: Colors.primary,
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
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  historyImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});