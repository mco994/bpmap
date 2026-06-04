import type { Festival, SizeTier, EventType } from "./types";
import { sizeTierForCapacity, isPast, effectiveEventType, genreLabel } from "./festivals";


export interface Filters {
  genres: string[];
  dateFrom: string | null;
  dateTo: string | null;
  organizer: string;
  artist: string;
  sizes: SizeTier[];
  priceDayMax: number | null;
  priceFullMax: number | null;
  includePast: boolean;
  eventTypes: EventType[];
}

export const EMPTY_FILTERS: Filters = {
  genres: [],
  dateFrom: null,
  dateTo: null,
  organizer: "",
  artist: "",
  sizes: [],
  priceDayMax: null,
  priceFullMax: null,
  includePast: false,
  eventTypes: [],
};

export function isEmptyFilters(f: Filters): boolean {
  return (
    f.genres.length === 0 &&
    !f.dateFrom &&
    !f.dateTo &&
    f.organizer.trim() === "" &&
    f.artist.trim() === "" &&
    f.sizes.length === 0 &&
    f.priceDayMax === null &&
    f.priceFullMax === null &&
    f.includePast === false &&
    f.eventTypes.length === 0
  );
}

export function matchesFilters(
  festival: Festival,
  f: Filters,
  now: Date | null = null,
): boolean {
  if (!f.includePast && now && isPast(festival, now)) return false;

  if (f.genres.length > 0 && !f.genres.some((g) => festival.genres.includes(g))) {
    return false;
  }

  if (
    f.eventTypes.length > 0 &&
    !f.eventTypes.includes(effectiveEventType(festival))
  ) {
    return false;
  }

  if (f.dateFrom || f.dateTo) {
    if (!festival.startDate || !festival.endDate) return false;
    if (f.dateFrom && festival.endDate < f.dateFrom) return false;
    if (f.dateTo && festival.startDate > f.dateTo) return false;
  }

  const org = f.organizer.trim().toLowerCase();
  if (org && !(festival.organizer ?? "").toLowerCase().includes(org)) {
    return false;
  }

  const artist = f.artist.trim().toLowerCase();
  if (
    artist &&
    !(festival.lineup ?? []).some((a) => a.toLowerCase().includes(artist))
  ) {
    return false;
  }

  if (f.sizes.length > 0) {
    const tier = sizeTierForCapacity(festival.capacity);
    if (tier === null || !f.sizes.includes(tier)) return false;
  }

  if (f.priceDayMax !== null) {
    if (festival.priceDay === null || festival.priceDay > f.priceDayMax) {
      return false;
    }
  }

  if (f.priceFullMax !== null) {
    if (festival.priceFull === null || festival.priceFull > f.priceFullMax) {
      return false;
    }
  }

  return true;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export type QueryMatchField = "name" | "city" | "organizer" | "artist" | "genre";

export interface QueryMatch {
  field: QueryMatchField;
  value: string;
  genreSlug?: string;
  approximate?: boolean;
}

function maxEditsFor(q: string): number {
  if (q.length <= 3) return 0;
  if (q.length <= 6) return 1;
  return 2;
}

interface ApproxWindow {
  dist: number;
  start: number;
  end: number;
}

function approxSubstringMatch(
  q: string,
  text: string,
  maxEdits: number,
): ApproxWindow | null {
  const m = q.length;
  const n = text.length;
  if (m === 0 || n === 0) return null;
  let prevD = new Array<number>(m + 1);
  let prevS = new Array<number>(m + 1);
  for (let i = 0; i <= m; i++) {
    prevD[i] = i;
    prevS[i] = 0;
  }
  let best: ApproxWindow | null = null;
  for (let j = 1; j <= n; j++) {
    const c = text[j - 1];
    const curD = new Array<number>(m + 1);
    const curS = new Array<number>(m + 1);
    curD[0] = 0;
    curS[0] = j;
    for (let i = 1; i <= m; i++) {
      let d = prevD[i - 1] + (q[i - 1] === c ? 0 : 1);
      let s = prevS[i - 1];
      if (prevD[i] + 1 < d) {
        d = prevD[i] + 1;
        s = prevS[i];
      }
      if (curD[i - 1] + 1 < d) {
        d = curD[i - 1] + 1;
        s = curS[i - 1];
      }
      curD[i] = d;
      curS[i] = s;
    }
    if (curD[m] <= maxEdits && (!best || curD[m] < best.dist)) {
      best = { dist: curD[m], start: curS[m], end: j };
    }
    prevD = curD;
    prevS = curS;
  }
  return best;
}

interface QueryCandidate {
  field: QueryMatchField;
  value: string;
  genreSlug?: string;
}

function queryCandidates(festival: Festival): QueryCandidate[] {
  return [
    { field: "name" as const, value: festival.name },
    { field: "city" as const, value: festival.city },
    ...(festival.lineup ?? []).map((a) => ({ field: "artist" as const, value: a })),
    ...festival.genres.map((slug) => ({
      field: "genre" as const,
      value: genreLabel(slug),
      genreSlug: slug,
    })),
    ...(festival.organizer
      ? [{ field: "organizer" as const, value: festival.organizer }]
      : []),
  ];
}

export function festivalQueryMatch(
  festival: Festival,
  query: string,
  opts?: { fuzzy?: boolean },
): QueryMatch | null {
  const q = normalizeText(query.trim());
  if (!q) return null;
  const candidates = queryCandidates(festival);
  const exact = candidates.find((c) => normalizeText(c.value).includes(q));
  if (exact) {
    return { field: exact.field, value: exact.value, genreSlug: exact.genreSlug };
  }
  if (!opts?.fuzzy) return null;
  const maxEdits = maxEditsFor(q);
  if (maxEdits === 0) return null;
  let best: { candidate: QueryCandidate; dist: number } | null = null;
  for (const candidate of candidates) {
    const win = approxSubstringMatch(q, normalizeText(candidate.value), maxEdits);
    if (win && (!best || win.dist < best.dist)) {
      best = { candidate, dist: win.dist };
    }
  }
  if (!best) return null;
  return {
    field: best.candidate.field,
    value: best.candidate.value,
    genreSlug: best.candidate.genreSlug,
    approximate: true,
  };
}

export function bestQueryMatch(festival: Festival, query: string): QueryMatch | null {
  return (
    festivalQueryMatch(festival, query) ??
    festivalQueryMatch(festival, query, { fuzzy: true })
  );
}

export function festivalMatchesQuery(festival: Festival, query: string): boolean {
  if (!query.trim()) return true;
  return festivalQueryMatch(festival, query) !== null;
}

export function filterFestivalsByQuery(
  festivals: Festival[],
  query: string,
): Festival[] {
  if (!query.trim()) return festivals;
  const exact = festivals.filter((f) => festivalQueryMatch(f, query) !== null);
  if (exact.length > 0) return exact;
  return festivals.filter(
    (f) => festivalQueryMatch(f, query, { fuzzy: true }) !== null,
  );
}

export function queryMatchRange(
  value: string,
  query: string,
): [number, number] | null {
  const q = normalizeText(query.trim());
  if (!q) return null;
  let normalized = "";
  const map: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const chunk = normalizeText(value[i]);
    for (let k = 0; k < chunk.length; k++) {
      normalized += chunk[k];
      map.push(i);
    }
  }
  const idx = normalized.indexOf(q);
  if (idx !== -1) {
    return [map[idx], map[idx + q.length - 1] + 1];
  }
  const maxEdits = maxEditsFor(q);
  if (maxEdits === 0) return null;
  const win = approxSubstringMatch(q, normalized, maxEdits);
  if (!win || win.end <= win.start) return null;
  return [map[win.start], map[win.end - 1] + 1];
}

export function applyFilters(
  festivals: Festival[],
  f: Filters,
  now: Date | null = null,
): Festival[] {
  return festivals.filter((festival) => matchesFilters(festival, f, now));
}
