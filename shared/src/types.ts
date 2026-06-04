
export type SizeTier = "S" | "M" | "L" | "XL";

export type FestivalStatus = "announced" | "confirmed" | "cancelled" | "passed";

export type EventType = "festival" | "open-air" | "soiree";

export interface Festival {
  id: string;
  slug: string;
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  lat: number;
  lng: number;
  city: string;
  region: string;
  organizer: string | null;
  capacity: number | null;
  genres: string[];
  priceDay: number | null;
  priceFull: number | null;
  tariffs?: { label: string; price: number | null }[];
  currency: string;
  ticketUrl: string | null;
  officialUrl: string | null;
  status: FestivalStatus;
  eventType?: EventType;
  eclectic?: boolean;
  lineup?: string[];
  sources?: string[];
}

export interface Genre {
  slug: string;
  label: string;
}
