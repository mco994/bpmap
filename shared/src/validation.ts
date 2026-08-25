import type { Festival } from "./types";

export const FRANCE_BOUNDS = {
  minLat: -22,
  maxLat: 52,
  minLng: -64,
  maxLng: 56,
};

const STATUSES = new Set(["announced", "confirmed", "cancelled", "passed"]);
const EVENT_TYPES = new Set(["festival", "open-air", "soiree"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_STRINGS = ["id", "slug", "name", "city", "region", "currency"] as const;
const URL_FIELDS = ["ticketUrl", "officialUrl"] as const;

export const MIN_RETAINED_RATIO = 0.7;
export const SIGNIFICANT_SET = 20;

export function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeUrl(value: string | null | undefined): string | null {
  return isHttpUrl(value) ? (value as string) : null;
}

export interface DatasetReport {
  errors: string[];
  warnings: string[];
}

export function validateFestival(festival: unknown, index: number): string[] {
  const record = festival as Record<string, unknown> | null;
  const label =
    (typeof record?.slug === "string" && record.slug) ||
    (typeof record?.name === "string" && record.name) ||
    `index ${index}`;
  const errors: string[] = [];
  const fail = (message: string) => errors.push(`${label} — ${message}`);

  if (!record || typeof record !== "object") return [`index ${index} — entrée non exploitable`];

  for (const field of REQUIRED_STRINGS) {
    const value = record[field];
    if (typeof value !== "string" || value.length === 0) {
      fail(`champ « ${field} » manquant ou vide`);
    }
  }

  const { lat, lng } = record as { lat?: unknown; lng?: unknown };
  if (typeof lat !== "number" || typeof lng !== "number") {
    fail("coordonnées manquantes");
  } else if (
    lat < FRANCE_BOUNDS.minLat ||
    lat > FRANCE_BOUNDS.maxLat ||
    lng < FRANCE_BOUNDS.minLng ||
    lng > FRANCE_BOUNDS.maxLng
  ) {
    fail(`coordonnées hors territoire français (${lat}, ${lng})`);
  }

  for (const field of ["startDate", "endDate"] as const) {
    const value = record[field];
    if (value !== null && !ISO_DATE.test(String(value ?? ""))) {
      fail(`« ${field} » invalide (${String(value)})`);
    }
  }
  const start = record.startDate as string | null;
  const end = record.endDate as string | null;
  if (start && end && end < start) fail("endDate antérieure à startDate");

  if (!STATUSES.has(String(record.status))) fail(`statut inconnu (${String(record.status)})`);
  if (record.eventType !== undefined && !EVENT_TYPES.has(String(record.eventType))) {
    fail(`type d'événement inconnu (${String(record.eventType)})`);
  }
  if (!Array.isArray(record.genres) || record.genres.length === 0) fail("aucun genre");

  for (const field of URL_FIELDS) {
    const value = record[field];
    if (value !== null && value !== undefined && !isHttpUrl(value)) {
      fail(`« ${field} » n'est pas une URL http(s) (${String(value)})`);
    }
  }
  for (const source of (record.sources as unknown[]) ?? []) {
    if (!isHttpUrl(source)) fail(`source non http(s) (${String(source)})`);
  }

  return errors;
}

export function validateDataset(
  current: unknown,
  previous?: unknown,
): DatasetReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(current)) {
    return { errors: ["le jeu de données n'est pas un tableau"], warnings };
  }

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  for (const [index, festival] of current.entries()) {
    errors.push(...validateFestival(festival, index));
    const { id, slug } = (festival ?? {}) as { id?: string; slug?: string };
    if (id) {
      if (seenIds.has(id)) errors.push(`${slug ?? id} — id dupliqué (${id})`);
      seenIds.add(id);
    }
    if (slug) {
      if (seenSlugs.has(slug)) errors.push(`${slug} — slug dupliqué`);
      seenSlugs.add(slug);
    }
  }

  if (Array.isArray(previous) && previous.length >= SIGNIFICANT_SET) {
    const ratio = current.length / previous.length;
    if (ratio < MIN_RETAINED_RATIO) {
      errors.push(
        `chute anormale du jeu de données : ${previous.length} → ${current.length} entrées ` +
          `(${Math.round(ratio * 100)} % conservés, seuil ${Math.round(MIN_RETAINED_RATIO * 100)} %)`,
      );
    } else if (current.length < previous.length) {
      warnings.push(
        `${previous.length - current.length} événement(s) retiré(s) depuis la version précédente.`,
      );
    }
  }

  return { errors, warnings };
}

export function assertFestivalShape(festivals: Festival[]): void {
  const { errors } = validateDataset(festivals);
  if (errors.length > 0) throw new Error(errors.join("\n"));
}
