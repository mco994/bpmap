import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiBaseUrl } from './config';

const REGISTERED_KEY = 'bpmap:push:registered';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function getPushToken(): Promise<string | null> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (typeof projectId !== 'string') return null;
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return result.data;
  } catch {
    return null;
  }
}

export async function syncPushSubscription(favorites: Set<string>): Promise<void> {
  const token = await getPushToken();
  if (!token) return;

  const payload = JSON.stringify({
    token,
    favorites: [...favorites].sort(),
    platform: Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : undefined,
  });

  try {
    const previous = await AsyncStorage.getItem(REGISTERED_KEY);
    if (previous) {
      const { payload: lastPayload, at } = JSON.parse(previous) as {
        payload: string;
        at: number;
      };
      if (lastPayload === payload && Date.now() - at < REFRESH_INTERVAL_MS) return;
    }
  } catch {}

  try {
    const res = await fetch(new URL('/api/push/register', apiBaseUrl()).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    if (res.ok) {
      await AsyncStorage.setItem(
        REGISTERED_KEY,
        JSON.stringify({ payload, at: Date.now() }),
      );
    }
  } catch {}
}
