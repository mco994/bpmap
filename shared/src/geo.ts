import type { Festival } from "./types";

export type LatLng = { lat: number; lng: number };

export type AddressSuggestion = { label: string; lat: number; lng: number };

export function directionsUrl(
  festival: Festival,
  origin?: string | LatLng,
): string {
  const destination = `${festival.lat},${festival.lng}`;
  let originParam = "";
  if (origin && typeof origin === "object") {
    originParam = `&origin=${origin.lat},${origin.lng}`;
  } else if (typeof origin === "string" && origin.trim()) {
    originParam = `&origin=${encodeURIComponent(origin.trim())}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}${originParam}&travelmode=driving`;
}

export async function suggestAddresses(
  query: string,
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`,
    );
    const json = (await res.json()) as {
      features?: {
        properties?: { label?: string };
        geometry?: { coordinates?: number[] };
      }[];
    };
    return (json.features ?? [])
      .map((f) => ({
        label: f.properties?.label ?? "",
        lng: f.geometry?.coordinates?.[0] ?? NaN,
        lat: f.geometry?.coordinates?.[1] ?? NaN,
      }))
      .filter((s) => s.label && Number.isFinite(s.lat) && Number.isFinite(s.lng));
  } catch {
    return [];
  }
}
