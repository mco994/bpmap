import type {
  Festival,
  FestivalStatus,
  Genre,
  SizeTier,
  EventType,
} from "./types";
import generated from "./data/festivals.json";

export const FESTIVALS = generated as unknown as Festival[];

export const GENRES: Genre[] = [
  { slug: "techno", label: "Techno" },
  { slug: "house", label: "House" },
  { slug: "french-touch", label: "French touch" },
  { slug: "drum-n-bass", label: "Drum'n'bass" },
  { slug: "trance", label: "Trance" },
  { slug: "psytrance", label: "Psytrance" },
  { slug: "hard-techno", label: "Hard techno" },
  { slug: "hardstyle", label: "Hardstyle / Hardcore" },
  { slug: "electro", label: "Electro" },
  { slug: "minimal", label: "Minimal" },
  { slug: "edm", label: "EDM / Big room" },
  { slug: "disco", label: "Disco" },
  { slug: "dub", label: "Dub / Bass" },
  { slug: "dubstep", label: "Dubstep" },
  { slug: "ambient", label: "Ambient / Expérimental" },
];

const GENRE_LABELS = new Map(GENRES.map((g) => [g.slug, g.label]));

export function genreLabel(slug: string): string {
  return GENRE_LABELS.get(slug) ?? slug;
}

export const EVENT_TYPES: { type: EventType; label: string }[] = [
  { type: "festival", label: "Festival" },
  { type: "open-air", label: "Open air" },
  { type: "soiree", label: "Soirée" },
];

export function effectiveEventType(festival: Festival): EventType {
  return festival.eventType ?? "festival";
}

export function eventTypeLabel(type: EventType): string {
  return EVENT_TYPES.find((t) => t.type === type)?.label ?? type;
}

export const SIZE_TIERS: { tier: SizeTier; label: string; min: number }[] = [
  { tier: "S", label: "Petit (< 5 000)", min: 0 },
  { tier: "M", label: "Moyen (5 000 – 15 000)", min: 5000 },
  { tier: "L", label: "Grand (15 000 – 50 000)", min: 15000 },
  { tier: "XL", label: "Très grand (50 000+)", min: 50000 },
];

export function sizeTierForCapacity(capacity: number | null): SizeTier | null {
  if (capacity === null) return null;
  if (capacity >= 50000) return "XL";
  if (capacity >= 15000) return "L";
  if (capacity >= 5000) return "M";
  return "S";
}

export function sizeTierLabel(tier: SizeTier): string {
  return SIZE_TIERS.find((t) => t.tier === tier)?.label ?? tier;
}

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

export function getPriceBounds(): { maxDay: number; maxFull: number } {
  const round = (n: number) => Math.ceil(n / 10) * 10;
  const notNull = (n: number | null): n is number => n !== null;
  const days = FESTIVALS.map((f) => f.priceDay).filter(notNull);
  const fulls = FESTIVALS.map((f) => f.priceFull).filter(notNull);
  return {
    maxDay: round(Math.max(0, ...days)),
    maxFull: round(Math.max(0, ...fulls)),
  };
}

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const DAY_MONTH_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
});

export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
): string {
  if (!startDate || !endDate) return "Dates à confirmer";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (startDate === endDate) return DATE_FMT.format(start);
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()} – ${DATE_FMT.format(end)}`;
  }
  return `${DAY_MONTH_FMT.format(start)} – ${DATE_FMT.format(end)}`;
}

export function formatPrice(price: number | null): string {
  if (price === null) return "—";
  if (price === 0) return "Gratuit";
  return `${price} €`;
}

export function priceFrom(festival: Festival): number | null {
  const candidates = [
    festival.priceDay,
    festival.priceFull,
    ...(festival.tariffs ?? []).map((t) => t.price),
  ].filter((p): p is number => typeof p === "number");
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

export function formatFromPrice(festival: Festival): string {
  const from = priceFrom(festival);
  if (from === null) return "—";
  if (from === 0) return "Gratuit";
  return `À partir de ${from} €`;
}


function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function effectiveStatus(
  festival: Festival,
  now: Date = new Date(),
): FestivalStatus {
  if (festival.status === "cancelled") return "cancelled";
  if (festival.endDate && new Date(festival.endDate) < atMidnight(now)) {
    return "passed";
  }
  return festival.status;
}

export function isPast(festival: Festival, now: Date = new Date()): boolean {
  return effectiveStatus(festival, now) === "passed";
}

export function isPurgeable(festival: Festival, now: Date = new Date()): boolean {
  if (!festival.endDate) return false;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 1);
  return new Date(festival.endDate) < atMidnight(cutoff);
}

const STATUS_LABELS: Record<FestivalStatus, string> = {
  announced: "Annoncé",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  passed: "Passé",
};

export function statusLabel(status: FestivalStatus): string {
  return STATUS_LABELS[status];
}
