import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Platform, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';

import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { authService } from '@/services/authService';

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

const FeatureItem: React.FC<{
  title: string;
  desc: string;
  icon?: string;
  image?: ImageSourcePropType;
  onPress?: () => void;
}> = ({ title, desc, icon, image, onPress }) => {
  const defaultOnPress = useCallback(() => Alert.alert('正在开发中'), []);
  
  return (
    <TouchableOpacity style={styles.item} onPress={onPress || defaultOnPress} activeOpacity={0.85}>
      <View style={styles.itemLeft}>
        <View style={styles.itemTitleRow}>
          <Text style={styles.itemTitle}>{title}</Text>
          {icon ? (
            <SvgUri width={14} height={14} uri={icon} />
          ) : null}
        </View>
        <Text style={styles.itemDesc}>{desc}</Text>
      </View>
      {image ? (
        <Image 
          source={image}
          style={styles.itemImage}
          resizeMode="cover"
        />
      ) : null}
    </TouchableOpacity>
  );
};

const handleMenuProduction = () => {
  Alert.alert('正在开发中');
};

const handlePosterPress = () => {
  router.push('/poster-generation');
};

const handleEventPress = () => {
  router.push('/file-upload-test');
};

const handleWeChatArticlePress = () => {
  router.push('/image-generation');
};

export const FeatureGrid: React.FC = () => {
  const [arrowRightSvgUri, setArrowRightSvgUri] = React.useState<string | null>(null);
  React.useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/UI/arrow-right.svg'));
        await asset.downloadAsync();
        setArrowRightSvgUri(asset.localUri || asset.uri);
      } catch {}
    })();
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitleSpecial}>实体宣传物料</Text>
      <View style={styles.row}>
        <FeatureItem
          title="店内海报"
          desc="让门店焕然一新"
          icon={arrowRightSvgUri || ''}
          image={require('../../assets/UI/bic-haibao.png')}
          onPress={handlePosterPress}
        />
        <FeatureItem
          title="菜单制作"
          desc="招牌一目了然"
          icon={arrowRightSvgUri || ''}
          image={require('../../assets/UI/bic-caidan.png')}
          onPress={handleMenuProduction}
        />
      </View>

      <Text style={styles.sectionTitleSpecial}>经营小工具</Text>
      <View style={styles.col}>
        <View style={styles.row}>
          <FeatureItem
            title="办个活动"
            desc="营销活动蓄力中"
            icon={arrowRightSvgUri || ''}
            image={require('../../assets/UI/bic-huodong.png')}
            onPress={handleEventPress}
          />
          <FeatureItem
            title="公众号推文"
            desc="专业网感写手"
            icon={arrowRightSvgUri || ''}
            image={require('../../assets/UI/bic-gongzhonghao.png')}
            onPress={handleWeChatArticlePress}
          />
        </View>
        <View style={styles.row}>
          <FeatureItem
            title="店内海报"
            desc="让门店焕然一新"
            icon={arrowRightSvgUri || ''}
            image={require('../../assets/UI/bic-haibao.png')}
            onPress={handlePosterPress}
          />
          <FeatureItem
            title="菜单制作"
            desc="招牌一目了然"
            icon={arrowRightSvgUri || ''}
            image={require('../../assets/UI/bic-caidan.png')}
            onPress={handleMenuProduction}
          />
        </View>
      </View>
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: '#F4F6F9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f1e2b',
    marginBottom: 8,
    fontFamily: 'LingGanHei'
  },
  sectionTitleSpecial: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f1e2b',
    marginBottom: 8,
    fontFamily: 'LingGanHei'
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    height: 66,
    marginBottom: 8,
  },
  col: { marginBottom: 8 },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    backgroundColor: '#eceff6',
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemLeft: { flex: 1 },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#0f1e2b',
    minWidth: 56,
    fontFamily: 'LingGanHei'
  },
  itemIcon: { 
    width: 14, 
    height: 14,
    resizeMode: 'contain',
  },
  itemDesc: {
    fontSize: 12,
    color: '#18254059',
  },
  itemImage: {
    height: '100%',
    width: 56,
  },
});
