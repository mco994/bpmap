import { describe, expect, it } from "vitest";
import { festivalJsonLd } from "@/lib/festival-jsonld";
import type { Festival } from "@bpmap/shared";

const base: Festival = {
  id: "f1",
  slug: "test-festival",
  name: "Test Festival",
  description: "Un festival de test.",
  startDate: "2026-07-10",
  endDate: "2026-07-12",
  lat: 48.85,
  lng: 2.35,
  city: "Paris",
  region: "Île-de-France",
  organizer: null,
  capacity: null,
  genres: ["techno"],
  priceDay: 20,
  priceFull: null,
  currency: "EUR",
  ticketUrl: null,
  officialUrl: null,
  status: "confirmed",
  eclectic: false,
  sources: [],
};
const NOW = new Date("2026-01-01T00:00:00Z");

describe("festivalJsonLd", () => {
  it("n'émet aucun MusicEvent sans date de début", () => {
    expect(festivalJsonLd({ ...base, startDate: null }, "https://x/f", NOW)).toBeNull();
  });

  it("porte startDate et endDate quand elles existent", () => {
    const ld = festivalJsonLd(base, "https://x/f", NOW);
    expect(ld?.startDate).toBe("2026-07-10");
    expect(ld?.endDate).toBe("2026-07-12");
    expect(ld?.["@type"]).toBe("MusicEvent");
  });
});
