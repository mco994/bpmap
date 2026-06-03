// Domain types for BPMap. These mirror the Supabase schema in
// `supabase/migrations/0001_init.sql` so the static seed and the future DB
// stay aligned.

export type SizeTier = "S" | "M" | "L" | "XL";

// "passed" is normally DERIVED from the end date (see effectiveStatus in
// lib/festivals.ts) rather than stored, but it is a valid stored value too so
// the daily ingestion job can persist it.
export type FestivalStatus = "announced" | "confirmed" | "cancelled" | "passed";

export type EventType = "festival" | "open-air" | "soiree";

export interface Festival {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** ISO date (yyyy-mm-dd), first day inclusive. Null when "dates à confirmer". */
  startDate: string | null;
  /** ISO date (yyyy-mm-dd), last day inclusive. Null when "dates à confirmer". */
  endDate: string | null;
  lat: number;
  lng: number;
  city: string;
  region: string;
  organizer: string | null;
  /** Approximate peak attendance (derives the size tier), or null if unknown. */
  capacity: number | null;
  /** Genre slugs, see GENRES in `lib/festivals.ts`. */
  genres: string[];
  /** Cheapest day pass in EUR, or null when unknown / no day pass is sold. */
  priceDay: number | null;
  /** Cheapest full-festival pass in EUR, or null when unknown. */
  priceFull: number | null;
  /** Detailed tariffs for the full sheet, e.g. [{ label: "Pass 2 jours", price: 90 }]. */
  tariffs?: { label: string; price: number | null }[];
  currency: string;
  ticketUrl: string | null;
  officialUrl: string | null;
  status: FestivalStatus;
  /** Event kind. Absent = festival (backward compatible). */
  eventType?: EventType;
  /** True for electro-dominant festivals that still mix in other genres. */
  eclectic?: boolean;
  /** Headline / announced artists (partial lineup). Powers the artist filter. */
  lineup?: string[];
  /** Source URLs used to verify this entry (provenance). */
  sources?: string[];
}

export interface Genre {
  slug: string;
  label: string;
}
