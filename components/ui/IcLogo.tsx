import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle, Image, Platform, TouchableOpacity, Alert } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { authService } from '@/services/authService';

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

interface IcLogoProps {
  style?: ViewStyle;
}

export const IcLogo: React.FC<IcLogoProps> = ({ style }) => {
  const [logoSvgUri, setLogoSvgUri] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/UI/logo-laicai.svg'));
        await asset.downloadAsync();
        setLogoSvgUri(asset.localUri || asset.uri);
      } catch {}
    })();
  }, []);
  const handleLogoPress = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
            } catch (error) {
              console.error('[IcLogo] 退出登录失败:', error);
              Alert.alert('提示', '退出登录失败，请重试');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.carrier, style]} 
      onPress={handleLogoPress}
      activeOpacity={0.7}
    >
      {logoSvgUri ? (
        <SvgUri width={39} height={17} uri={logoSvgUri} />
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  carrier: {
    width: 39,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
