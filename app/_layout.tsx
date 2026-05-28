// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import '../i18n/i18n.config';
import { useUserStore } from '../store/userStore';
import { useAppTheme } from '../theme/useAppTheme';

// Minimum splash duration (ms) so the animation plays fully
const SPLASH_DURATION = 2400;

export default function RootLayout() {
  const { user } = useUserStore();
  const { isDark } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();

  // Two gates: (1) Zustand has rehydrated from AsyncStorage, (2) splash played long enough
  const [hydrated, setHydrated] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const isReady = hydrated && splashDone;

  // Wait for Zustand persist to rehydrate
  useEffect(() => {
    // useUserStore.persist is available when using zustand/middleware persist
    const unsub = (useUserStore as any).persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });
    // Fallback: if already hydrated or no persist layer
    if ((useUserStore as any).persist?.hasHydrated?.()) {
      setHydrated(true);
    } else {
      // Give AsyncStorage max 1s to hydrate, then proceed
      const timer = setTimeout(() => setHydrated(true), 800);
      return () => { clearTimeout(timer); unsub?.(); };
    }
    return () => unsub?.();
  }, []);

  // Enforce minimum splash display time
  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // Route once both gates pass
  useEffect(() => {
    if (!isReady) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === '(auth)';
    const isRoot =
      segs.length === 0 ||
      (segs.length === 1 && segs[0] === 'index') ||
      !segs[0];

    if (!user && (!inAuthGroup || isRoot)) {
      router.replace('/(auth)/login');
    } else if (user && !user.name && segs[1] !== 'setup') {
      router.replace('/(auth)/setup');
    } else if (user && user.name && (inAuthGroup || isRoot)) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="farm/[id]" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
