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

export async function openDirections(festival: Festival): Promise<void> {
  const destination = `${festival.lat},${festival.lng}`;
  const origin = await getCurrentCoords();
  const originParam = origin ? `&origin=${origin.lat},${origin.lng}` : '';
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}${originParam}&travelmode=driving`;
  await Linking.openURL(url);
}
