import type { Festival } from "../types";

export function makeFestival(overrides: Partial<Festival> = {}): Festival {
  return {
    id: "f1",
    slug: "festival-test",
    name: "Festival Test",
    description: "Un festival de test.",
    startDate: "2026-07-10",
    endDate: "2026-07-12",
    lat: 45.5,
    lng: 4.5,
    city: "Lyon",
    region: "Auvergne-Rhône-Alpes",
    organizer: "Collectif Test",
    capacity: 8000,
    genres: ["techno"],
    priceDay: 40,
    priceFull: 90,
    currency: "EUR",
    ticketUrl: null,
    officialUrl: null,
    status: "confirmed",
    ...overrides,
  };
}
