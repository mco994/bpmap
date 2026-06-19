import type { Festival } from "./types";
import { getAllFestivals, GENRES, effectiveStatus } from "./festivals";

export function regionSlug(region: string): string {
  return region
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const FR_COLLATOR = new Intl.Collator("fr");

function upcomingFestivals(now: Date): Festival[] {
  return getAllFestivals().filter((f) => effectiveStatus(f, now) !== "passed");
}

function byStartDate(a: Festival, b: Festival): number {
  const aKey = a.startDate ?? "9999";
  const bKey = b.startDate ?? "9999";
  return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
}

export function getGenresWithCounts(
  now: Date = new Date(),
): { slug: string; label: string; count: number }[] {
  const upcoming = upcomingFestivals(now);
  return GENRES.map((g) => ({
    slug: g.slug,
    label: g.label,
    count: upcoming.filter((f) => f.genres.includes(g.slug)).length,
  }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function getRegionsWithCounts(
  now: Date = new Date(),
): { region: string; slug: string; count: number }[] {
  const upcoming = upcomingFestivals(now);
  const counts = new Map<string, number>();
  for (const f of upcoming) {
    if (!f.region) continue;
    counts.set(f.region, (counts.get(f.region) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([region, count]) => ({ region, slug: regionSlug(region), count }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count || FR_COLLATOR.compare(a.region, b.region));
}

export function getFestivalsByGenre(
  slug: string,
  now: Date = new Date(),
): Festival[] {
  return upcomingFestivals(now)
    .filter((f) => f.genres.includes(slug))
    .sort(byStartDate);
}

export function getFestivalsByRegion(
  slug: string,
  now: Date = new Date(),
): Festival[] {
  return upcomingFestivals(now)
    .filter((f) => f.region && regionSlug(f.region) === slug)
    .sort(byStartDate);
}

export function getRegionBySlug(slug: string): string | undefined {
  return getAllFestivals().find((f) => f.region && regionSlug(f.region) === slug)
    ?.region;
}
