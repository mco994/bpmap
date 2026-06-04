"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "bpmap:favorites";
const EMPTY = new Set<string>();

let favorites = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) favorites = new Set<string>(JSON.parse(raw));
  } catch {
    favorites = new Set<string>();
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {}
}

export function toggleFavorite(id: string) {
  load();
  const next = new Set(favorites);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  favorites = next;
  persist();
  emit();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      favorites = new Set<string>(e.newValue ? JSON.parse(e.newValue) : []);
      emit();
    } catch {}
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return favorites;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useFavorites() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsFavorite(id: string) {
  return useFavorites().has(id);
}
