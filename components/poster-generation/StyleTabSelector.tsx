import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface Style {
  id: string;
  name: string;
  gradientColors: readonly [string, string];
  image: string;
}

interface StyleTabSelectorProps {
  styles: Style[];
  selectedStyle: string;
  onStyleSelect: (styleId: string) => void;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 312,
    height: 104,
    marginLeft: -3,
  },
  tabContainer: {
    width: 80,
    height: 104,
    position: 'relative',
    marginLeft: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyLayer: {
    width: 72,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textContent: {
    position: 'absolute',
    bottom: 6,
    left: 14,
    right: 14,
    alignItems: 'flex-start',
  },
  tabText: {
    minWidth: 44,
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  selectBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 104,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export const StyleTabSelector: React.FC<StyleTabSelectorProps> = ({
  styles: styleList,
  selectedStyle,
  onStyleSelect,
}) => {
  return (
    <View style={styles.container}>
      {styleList.map((style, index) => {
        const isSelected = selectedStyle === style.id;
        const marginLeft = index === 0 ? 0 : (index === 1 ? 5 : 8);
        
        return (
          <TouchableOpacity
            key={style.id}
            style={[styles.tabContainer, { marginLeft }]}
            onPress={() => onStyleSelect(style.id)}
            activeOpacity={0.8}
          >
            {/* select-border - 选中时透明度100%，未选中时透明度0 */}
            <View 
              style={[
                styles.selectBorder,
                { opacity: isSelected ? 1 : 0 }
              ]}
            />
            
            {/* body层 - 包含背景图片和渐变，居中在父容器里 */}
            <View style={styles.bodyLayer}>
              {/* 背景图片 */}
              <Image 
                source={{ uri: style.image }} 
                style={styles.backgroundImage}
                resizeMode="cover"
              />
              
              {/* 渐变遮罩 */}
              <LinearGradient
                style={styles.gradientOverlay}
                colors={style.gradientColors}
                locations={[0.6875, 1]}
              />
              
              {/* 文本内容 */}
              <View style={styles.textContent}>
                <Text style={styles.tabText}>{style.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};