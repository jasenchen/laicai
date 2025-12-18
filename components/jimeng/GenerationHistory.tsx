import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Image, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaContainer } from '@/components/SafeAreaContainer';
import { JimengHeader } from '@/components/jimeng/JimengHeader';
import { ImageViewer } from '@/components/ui/ImageViewer';
import { Colors } from '@/constants/Colors';
import { JimengGenerationHistory } from '@/types/jimeng';
import { jimengImageService } from '@/services/jimengImageService';

interface GenerationHistoryProps {
  onBack: () => void;
  onSelectHistory: (item: JimengGenerationHistory) => void;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  onBack,
  onSelectHistory,
}) => {
  const [history, setHistory] = useState<JimengGenerationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const historyData = await jimengImageService.getGenerationHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      Alert.alert('错误', '加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      '清除历史记录',
      '确定要清除所有历史记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await jimengImageService.clearHistory();
              setHistory([]);
            } catch (error) {
              console.error('清除历史记录失败:', error);
              Alert.alert('错误', '清除历史记录失败');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageViewer(true);
  };

  const handleImageViewerClose = () => {
    setShowImageViewer(false);
    setSelectedImage(null);
  };

  const renderHistoryItem = ({ item }: { item: JimengGenerationHistory }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => onSelectHistory(item)}
    >
      <TouchableOpacity onPress={() => handleImagePress(item.result_image)}>
        <Image 
          source={{ uri: item.result_image }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.itemContent}>
        <Text style={styles.prompt} numberOfLines={2}>
          {item.prompt}
        </Text>
        <View style={styles.itemDetails}>
          <Text style={styles.style}>{item.style}</Text>
          <Text style={styles.size}>{item.size}</Text>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaContainer style={styles.container}>
      <JimengHeader 
        title="生成历史"
        onBack={onBack}
        showHistory={false}
      />
      
      {history.length > 0 && (
        <View style={styles.headerActions}>
          <Text style={styles.count}>共 {history.length} 条记录</Text>
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.clearText}>清除</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>暂无生成历史</Text>
          <Text style={styles.emptySubtext}>开始创作你的第一张图片吧！</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
      
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  count: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    fontSize: 14,
    color: Colors.error,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  prompt: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  style: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  size: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
});