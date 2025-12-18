import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Colors } from '@/constants/Colors';

export default function RootLayout() {
  const [loaded] = useFonts({
    ZaoziYuanHei: require('../assets/fonts/造字工房元黑体.ttf'),
    LingGanHei: require('../assets/fonts/灵感体 灵感粗黑.otf')
  });
  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="image-generation" options={{ headerShown: false }} />
          <Stack.Screen name="poster-generation" options={{ headerShown: false }} />
          <Stack.Screen name="generation-result" options={{ headerShown: false }} />
          <Stack.Screen name="auth-debug" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
