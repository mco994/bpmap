import { useEffect, useRef } from 'react';
import { AppState, StyleSheet, type AppStateStatus } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';

import { checkChangesAndNotify } from '@/lib/changes';
import { currentFavorites } from '@/lib/favorites';
import { syncPushSubscription } from '@/lib/push';

async function syncPush() {
  syncPushSubscription(await currentFavorites());
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    void checkChangesAndNotify();
    void syncPush();
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        void checkChangesAndNotify();
        void syncPush();
      }
      appState.current = next;
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const slug = response.notification.request.content.data?.slug;
      if (typeof slug === 'string') router.push(`/festival/${slug}`);
    });
    return () => subscription.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ animation: reducedMotion ? 'fade' : 'default' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="festival/[slug]" options={{ title: 'Festival' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
