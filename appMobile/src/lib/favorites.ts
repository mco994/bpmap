import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'bpmap:favorites';

let favorites = new Set<string>();
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      favorites = new Set<string>(JSON.parse(raw));
      emit();
    }
  } catch {
    loaded = false;
  }
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {}
}

export function toggleFavorite(id: string) {
  const next = new Set(favorites);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  favorites = next;
  emit();
  void persist();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void load();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return favorites;
}

export function useFavorites() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useIsFavorite(id: string) {
  return useFavorites().has(id);
}
