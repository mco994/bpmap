import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { changeTypeLabel, type Change } from '@bpmap/shared';

import { apiBaseUrl } from './config';
import { ensureNotificationSetup, CHANGES_CHANNEL_ID } from './notifications';

const LAST_CHECK_KEY = 'bpmap:changes:lastCheck';
const NOTIFIED_KEY = 'bpmap:changes:notified';
const FAVORITES_KEY = 'bpmap:favorites';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const MAX_NOTIFIED = 200;

export async function fetchChanges(since?: string): Promise<Change[]> {
  const url = new URL('/api/changes', apiBaseUrl());
  if (since) url.searchParams.set('since', since);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { changes?: Change[] };
  return json.changes ?? [];
}

async function readFavorites(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

async function readNotified(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

async function persistNotified(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      NOTIFIED_KEY,
      JSON.stringify(ids.slice(-MAX_NOTIFIED)),
    );
  } catch {}
}

async function notifyChange(change: Change): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${change.festivalName} — ${changeTypeLabel(change.type)}`,
      body: change.summary,
      data: { slug: change.festivalSlug },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + 1000), channelId: CHANGES_CHANNEL_ID },
  });
}

export async function checkChangesAndNotify(force = false): Promise<number> {
  const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
  if (!force && lastCheck) {
    const elapsed = Date.now() - Number(lastCheck);
    if (Number.isFinite(elapsed) && elapsed < CHECK_INTERVAL_MS) return 0;
  }

  let changes: Change[];
  try {
    changes = await fetchChanges();
  } catch {
    return 0;
  }

  await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));

  const favorites = await readFavorites();
  const notified = await readNotified();
  const relevant = changes.filter(
    (c) => !notified.has(c.id) && (c.type === 'added' || favorites.has(c.festivalId)),
  );
  if (relevant.length === 0) return 0;

  const granted = await ensureNotificationSetup();
  if (!granted) return 0;

  for (const change of relevant) {
    await notifyChange(change);
    notified.add(change.id);
  }

  await persistNotified([...notified]);
  return relevant.length;
}
