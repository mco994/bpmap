"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "bpmap:artists";
const EMPTY = new Set<string>();

let artists = EMPTY;
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
    if (raw) artists = new Set<string>(JSON.parse(raw));
  } catch {
    artists = new Set<string>();
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...artists]));
  } catch {}
}

export function toggleFollowedArtist(slug: string) {
  load();
  const next = new Set(artists);
  if (next.has(slug)) next.delete(slug);
  else next.add(slug);
  artists = next;
  persist();
  emit();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      artists = new Set<string>(e.newValue ? JSON.parse(e.newValue) : []);
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
  return artists;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useFollowedArtists() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsFollowedArtist(slug: string) {
  return useFollowedArtists().has(slug);
}
