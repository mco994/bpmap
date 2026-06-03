import { Linking } from 'react-native';
import * as Location from 'expo-location';
import type { Festival } from '@bpmap/shared';

export async function getCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  const current = await Location.getForegroundPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain) {
    const requested = await Location.requestForegroundPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) return null;
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}

export async function openDirections(
  festival: Festival,
  origin?: string | { lat: number; lng: number },
): Promise<void> {
  const destination = `${festival.lat},${festival.lng}`;
  let originParam = '';
  if (origin && typeof origin === 'object') {
    originParam = `&origin=${origin.lat},${origin.lng}`;
  } else if (origin && origin.trim()) {
    originParam = `&origin=${encodeURIComponent(origin.trim())}`;
  } else {
    const current = await getCurrentCoords();
    if (current) originParam = `&origin=${current.lat},${current.lng}`;
  }
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}${originParam}&travelmode=driving`;
  await Linking.openURL(url);
}

export type AddressSuggestion = { label: string; lat: number; lng: number };

export async function suggestAddresses(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`,
    );
    const json: {
      features?: { properties?: { label?: string }; geometry?: { coordinates?: number[] } }[];
    } = await res.json();
    return (json.features ?? [])
      .map((f) => ({
        label: f.properties?.label ?? '',
        lng: f.geometry?.coordinates?.[0] ?? NaN,
        lat: f.geometry?.coordinates?.[1] ?? NaN,
      }))
      .filter((s) => s.label && Number.isFinite(s.lat) && Number.isFinite(s.lng));
  } catch {
    return [];
  }
}
