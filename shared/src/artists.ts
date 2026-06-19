import type { Festival } from "./types";
import { FESTIVALS, isPast } from "./festivals";

const FR_COLLATOR = new Intl.Collator("fr");

export function artistSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ArtistEntry {
  name: string;
  slug: string;
  count: number;
}

function buildIndex(): Map<string, ArtistEntry> {
  const bySlug = new Map<string, ArtistEntry>();
  for (const festival of FESTIVALS) {
    const seen = new Set<string>();
    for (const name of festival.lineup ?? []) {
      const slug = artistSlug(name);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const existing = bySlug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(slug, { name, slug, count: 1 });
      }
    }
  }
  return bySlug;
}

export function getArtistsWithCounts(): ArtistEntry[] {
  return [...buildIndex().values()].sort((a, b) => {
    if (a.count !== b.count) return b.count - a.count;
    return FR_COLLATOR.compare(a.name, b.name);
  });
}

export function getArtistBySlug(
  slug: string,
): { name: string; slug: string } | undefined {
  const entry = buildIndex().get(slug);
  if (!entry) return undefined;
  return { name: entry.name, slug: entry.slug };
}

export function getFestivalsByArtist(slug: string, now?: Date): Festival[] {
  const reference = now ?? new Date();
  const matches = FESTIVALS.filter((festival) =>
    (festival.lineup ?? []).some((name) => artistSlug(name) === slug),
  );
  return matches.sort((a, b) => {
    const aPast = isPast(a, reference);
    const bPast = isPast(b, reference);
    if (aPast !== bPast) return aPast ? 1 : -1;
    const aKey = a.startDate ?? "9999";
    const bKey = b.startDate ?? "9999";
    if (aKey !== bKey) return aKey < bKey ? -1 : 1;
    return FR_COLLATOR.compare(a.name, b.name);
  });
}
