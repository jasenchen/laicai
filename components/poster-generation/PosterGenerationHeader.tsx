import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

const SvgIcon = ({ width, height, uri, style }: { width: number; height: number; uri: string; style?: any }) => {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={[{ width, height, resizeMode: 'contain' }, style]} />;
  }
  return <SvgUri width={width} height={height} uri={uri} />;
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 338,
    paddingVertical: 10,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 7,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(236, 239, 246, 0.4)',
    borderRadius: 16,
  },
  backIcon: {
    width: 18,
    height: 18,
  },
});

export const PosterGenerationHeader: React.FC = () => {
  const router = useRouter();
  const [backSvgUri, setBackSvgUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const asset = Asset.fromModule(require('../../assets/UI/arrow-back.svg'));
      setBackSvgUri(asset.uri);
    } catch {}
  }, []);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        {backSvgUri ? (
          <SvgUri width={18} height={18} uri={backSvgUri} style={styles.backIcon} />
        ) : null}
      </TouchableOpacity>
    </View>
  );
};
