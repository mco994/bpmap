import type { Festival, SizeTier, EventType } from "./types";
import { sizeTierForCapacity, isPast, effectiveEventType } from "./festivals";

// Shared, framework-agnostic filtering logic so the client (MVP) and a future
// server/PostGIS path apply exactly the same rules.

export interface Filters {
  /** Selected genre slugs. A festival matches if it has ANY of them (OR). */
  genres: string[];
  /** Inclusive ISO date bounds on the festival's run. Null = unbounded. */
  dateFrom: string | null;
  dateTo: string | null;
  /** Case-insensitive substring match on the organizer. */
  organizer: string;
  /** Case-insensitive substring match on any artist in the lineup. */
  artist: string;
  /** Selected size tiers. A festival matches if its tier is among them. */
  sizes: SizeTier[];
  /** Upper bound on the cheapest day pass. Null = no constraint. */
  priceDayMax: number | null;
  /** Upper bound on the cheapest full-festival pass. Null = no constraint. */
  priceFullMax: number | null;
  /** When false (default), festivals that are already over are hidden. */
  includePast: boolean;
  /** Selected event types. Empty = all types. */
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

/** True when filters are at their defaults (used to disable the reset button). */
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
  // Past festivals are hidden unless explicitly included. `now` is null during
  // SSR / first client render (see Explorer) so server and client agree.
  if (!f.includePast && now && isPast(festival, now)) return false;

  // Genre: festival must share at least one selected genre.
  if (f.genres.length > 0 && !f.genres.some((g) => festival.genres.includes(g))) {
    return false;
  }

  // Event type: when active, the festival's type must be among those selected.
  if (
    f.eventTypes.length > 0 &&
    !f.eventTypes.includes(effectiveEventType(festival))
  ) {
    return false;
  }

  // Date: the festival's run must overlap the [dateFrom, dateTo] window.
  // Festivals with unconfirmed dates are excluded when a date filter is active.
  if (f.dateFrom || f.dateTo) {
    if (!festival.startDate || !festival.endDate) return false;
    if (f.dateFrom && festival.endDate < f.dateFrom) return false;
    if (f.dateTo && festival.startDate > f.dateTo) return false;
  }

  // Organizer: case-insensitive substring match.
  const org = f.organizer.trim().toLowerCase();
  if (org && !(festival.organizer ?? "").toLowerCase().includes(org)) {
    return false;
  }

  // Artist: match any artist in the lineup.
  const artist = f.artist.trim().toLowerCase();
  if (
    artist &&
    !(festival.lineup ?? []).some((a) => a.toLowerCase().includes(artist))
  ) {
    return false;
  }

  // Size tier (festivals with unknown capacity are excluded when this filter
  // is active).
  if (f.sizes.length > 0) {
    const tier = sizeTierForCapacity(festival.capacity);
    if (tier === null || !f.sizes.includes(tier)) return false;
  }

  // Day price: a festival with no day pass (null) is excluded when this
  // constraint is active, since the user is filtering on a day-pass budget.
  if (f.priceDayMax !== null) {
    if (festival.priceDay === null || festival.priceDay > f.priceDayMax) {
      return false;
    }
  }

  // Full-festival price (a festival with unknown price is excluded when this
  // constraint is active).
  if (f.priceFullMax !== null) {
    if (festival.priceFull === null || festival.priceFull > f.priceFullMax) {
      return false;
    }
  }

  return true;
}

export function applyFilters(
  festivals: Festival[],
  f: Filters,
  now: Date | null = null,
): Festival[] {
  return festivals.filter((festival) => matchesFilters(festival, f, now));
}
