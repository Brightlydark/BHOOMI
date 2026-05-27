import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../i18n/i18n.config';
import { useUserStore } from '../store/userStore';

export default function RootLayout() {
  const { user } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === '(auth)';
    const isRoot = segs.length === 0 || (segs.length === 1 && segs[0] === 'index') || !segs[0];
    const segmentOne = segs.length > 1 ? segs[1] : undefined;
    
    if (!user && (!inAuthGroup || isRoot)) {
      router.replace('/(auth)/login');
    } else if (user && !user.name && segmentOne !== 'setup') {
      router.replace('/(auth)/setup');
    } else if (user && user.name && (inAuthGroup || isRoot)) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="farm/[id]" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
