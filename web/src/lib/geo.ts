import { directionsUrl, type Festival, type LatLng } from "@bpmap/shared";

export { suggestAddresses, type AddressSuggestion } from "@bpmap/shared";

export function getCurrentCoords(): Promise<LatLng | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  });
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
  window.open(
    directionsUrl(festival, resolved),
    "_blank",
    "noopener,noreferrer",
  );
}
