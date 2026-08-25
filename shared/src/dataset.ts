import type { Festival, PriceBounds } from "./types";
import { getPriceBoundsFor } from "./festivals";
import generated from "./data/festivals.json";

export const FESTIVALS = generated as unknown as Festival[];

const FR_COLLATOR = new Intl.Collator("fr");

export function getAllFestivals(): Festival[] {
  return [...FESTIVALS].sort((a, b) => {
    const aKey = a.startDate ?? "9999";
    const bKey = b.startDate ?? "9999";
    return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
  });
}

export function getFestivalBySlug(slug: string): Festival | undefined {
  return FESTIVALS.find((f) => f.slug === slug);
}

export function getOrganizers(): string[] {
  const names = FESTIVALS.map((f) => f.organizer).filter(
    (o): o is string => !!o,
  );
  return [...new Set(names)].sort(FR_COLLATOR.compare);
}

export function getArtists(): string[] {
  const all = FESTIVALS.flatMap((f) => f.lineup ?? []);
  return [...new Set(all)].sort(FR_COLLATOR.compare);
}

export function getPriceBounds(): PriceBounds {
  return getPriceBoundsFor(FESTIVALS);
}
