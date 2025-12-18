import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';

const ICONS = {
  keyboard: require('../../assets/UI/ic-keyborad.svg'),
  call: require('../../assets/UI/ic-call.svg'),
};

export const ChatBar: React.FC = () => {
  const [keyboardSvgUri, setKeyboardSvgUri] = useState<string | null>(null);
  const [callSvgUri, setCallSvgUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const k = Asset.fromModule(ICONS.keyboard);
        await k.downloadAsync();
        setKeyboardSvgUri(k.localUri || k.uri);
      } catch {}
    })();
    (async () => {
      try {
        const c = Asset.fromModule(ICONS.call);
        await c.downloadAsync();
        setCallSvgUri(c.localUri || c.uri);
      } catch {}
    })();
  }, []);
  const onPress = useCallback(() => Alert.alert('正在开发中'), []);
  
  return (
    <View
      style={[
        styles.clipContainer,
        {
          bottom: 8 // 固定8px距离，不添加安全区域
        }
      ]}
    >
      <BlurView
        intensity={10}
        style={styles.blurContainer}
        tint="light"
      >
        <View style={styles.contentContainer}>
          <View style={styles.topLine} />
          <View style={styles.main}>
            <TouchableOpacity style={styles.input} onPress={onPress} activeOpacity={0.85}>
              <Text style={styles.inputText}>按住对话</Text>
              <View style={styles.inputIconContainer}>
                {keyboardSvgUri ? (
                  <SvgUri width={24} height={24} uri={keyboardSvgUri} />
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.voice} onPress={onPress} activeOpacity={0.85}>
              {callSvgUri ? (
                <SvgUri width={20} height={20} uri={callSvgUri} />
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  clipContainer: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 32,
    overflow: 'hidden',
  },
  blurContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 19,
    backgroundColor: '#fcfdfff2',
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  topLine: {
    width: 48,
    height: 8,
    backgroundColor: '#dde5f1',
    borderRadius: 100,
    marginBottom: 12,
  },
  main: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 56,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 71, // 设计稿中的gap-x-[71px]
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flex: 1,
    height: 56,
    backgroundColor: '#ffffffbf',
    borderRadius: 14,
    // 使用平台兼容的阴影
    ...Platform.select({
      ios: {
        shadowColor: '#a8b4ce',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
      },
      android: {
        elevation: 8,
        backgroundColor: '#ffffffbf',
      },
      web: {
        boxShadow: '0px 6px 50px 0px rgba(168, 180, 206, 0.35)',
      },
    }),
  },
  inputText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#282c39e8',
    minWidth: 56,
    lineHeight: 28,
  },
  inputIconContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    width: 56,
    height: 56,
    backgroundColor: '#ffffffbf',
    borderRadius: 14,
    marginLeft: 10,
    // 使用平台兼容的阴影
    ...Platform.select({
      ios: {
        shadowColor: '#a8b4ce',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
      },
      android: {
        elevation: 8,
        backgroundColor: '#ffffffbf',
      },
      web: {
        boxShadow: '0px 6px 50px -5px rgba(168, 180, 206, 0.35)',
      },
    }),
  },
});
