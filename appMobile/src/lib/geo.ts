import { Linking } from 'react-native';
import * as Location from 'expo-location';
import { directionsUrl, type Festival, type LatLng } from '@bpmap/shared';

export { suggestAddresses, type AddressSuggestion } from '@bpmap/shared';

export async function getCurrentCoords(): Promise<LatLng | null> {
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
  origin?: string | LatLng,
): Promise<void> {
  let resolved = origin;
  if (!resolved) {
    const current = await getCurrentCoords();
    if (current) resolved = current;
  }
  await Linking.openURL(directionsUrl(festival, resolved));
}
