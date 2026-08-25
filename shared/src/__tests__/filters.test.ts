import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  applyFilters,
  bestQueryMatch,
  festivalMatchesQuery,
  filterFestivalsByQuery,
  isEmptyFilters,
  matchesFilters,
  normalizeText,
  queryMatchRange,
} from "../filters";
import { makeFestival } from "./fixtures";

const NOW = new Date(2026, 5, 1);

describe("isEmptyFilters", () => {
  it("reconnaît le jeu vide et le moindre écart", () => {
    expect(isEmptyFilters(EMPTY_FILTERS)).toBe(true);
    expect(isEmptyFilters({ ...EMPTY_FILTERS, includePast: true })).toBe(false);
    expect(isEmptyFilters({ ...EMPTY_FILTERS, organizer: "   " })).toBe(true);
  });
});

describe("matchesFilters", () => {
  it("écarte les événements passés sauf demande explicite", () => {
    const past = makeFestival({ startDate: "2025-12-30", endDate: "2026-01-01" });
    expect(matchesFilters(past, EMPTY_FILTERS, NOW)).toBe(false);
    expect(matchesFilters(past, { ...EMPTY_FILTERS, includePast: true }, NOW)).toBe(true);
  });

  it("laisse tout passer tant que la date courante est inconnue", () => {
    const past = makeFestival({ startDate: "2025-12-30", endDate: "2026-01-01" });
    expect(matchesFilters(past, EMPTY_FILTERS, null)).toBe(true);
  });

  it("garde un événement dès qu'un genre coché correspond", () => {
    const festival = makeFestival({ genres: ["techno", "house"] });
    expect(matchesFilters(festival, { ...EMPTY_FILTERS, genres: ["house"] }, NOW)).toBe(true);
    expect(matchesFilters(festival, { ...EMPTY_FILTERS, genres: ["trance"] }, NOW)).toBe(false);
  });

  it("filtre sur le chevauchement de plage, pas sur la date de début seule", () => {
    const festival = makeFestival({ startDate: "2026-07-10", endDate: "2026-07-12" });
    const spanning = { ...EMPTY_FILTERS, dateFrom: "2026-07-11", dateTo: "2026-07-20" };
    expect(matchesFilters(festival, spanning, NOW)).toBe(true);
    const after = { ...EMPTY_FILTERS, dateFrom: "2026-07-13", dateTo: "2026-07-20" };
    expect(matchesFilters(festival, after, NOW)).toBe(false);
  });

  it("exige un tarif connu quand un plafond de prix est posé", () => {
    const withoutPrice = makeFestival({ priceDay: null });
    expect(matchesFilters(withoutPrice, { ...EMPTY_FILTERS, priceDayMax: 100 }, NOW)).toBe(false);
  });

  it("exige une capacité connue quand une taille est cochée", () => {
    const unknownSize = makeFestival({ capacity: null });
    expect(matchesFilters(unknownSize, { ...EMPTY_FILTERS, sizes: ["S"] }, NOW)).toBe(false);
  });

  it("cherche l'organisateur et l'artiste sans tenir compte de la casse", () => {
    const festival = makeFestival({ organizer: "Collectif Nuit", lineup: ["Amelie Lens"] });
    expect(matchesFilters(festival, { ...EMPTY_FILTERS, organizer: "nuit" }, NOW)).toBe(true);
    expect(matchesFilters(festival, { ...EMPTY_FILTERS, artist: "amelie" }, NOW)).toBe(true);
    expect(matchesFilters(festival, { ...EMPTY_FILTERS, artist: "charlotte" }, NOW)).toBe(false);
  });
});

describe("normalizeText", () => {
  it("efface accents, casse et ponctuation", () => {
    expect(normalizeText("ÉlecTro-Nuit !")).toBe("electronuit");
  });
});

describe("bestQueryMatch", () => {
  const festival = makeFestival({
    name: "Nuits Sonores",
    city: "Lyon",
    genres: ["techno"],
    lineup: ["Jeff Mills"],
    organizer: "Arty Farty",
  });

  it("privilégie une correspondance exacte sur le nom", () => {
    expect(bestQueryMatch(festival, "sonores")).toEqual({
      field: "name",
      value: "Nuits Sonores",
      genreSlug: undefined,
    });
  });

  it("retrouve la ville, le line-up, le genre et l'organisateur", () => {
    expect(bestQueryMatch(festival, "lyon")?.field).toBe("city");
    expect(bestQueryMatch(festival, "mills")?.field).toBe("artist");
    expect(bestQueryMatch(festival, "arty")?.field).toBe("organizer");
    const genre = bestQueryMatch(festival, "techno");
    expect(genre?.field).toBe("genre");
    expect(genre?.genreSlug).toBe("techno");
  });

  it("tolère une faute de frappe et le signale comme approximatif", () => {
    const match = bestQueryMatch(festival, "sonorse");
    expect(match?.field).toBe("name");
    expect(match?.approximate).toBe(true);
  });

  it("n'accepte aucun écart sur les requêtes très courtes", () => {
    expect(bestQueryMatch(festival, "lyn")).toBeNull();
  });

  it("ignore les accents de la requête", () => {
    expect(festivalMatchesQuery(makeFestival({ city: "Nîmes" }), "nimes")).toBe(true);
  });
});

describe("filterFestivalsByQuery", () => {
  const sonores = makeFestival({ id: "a", name: "Nuits Sonores" });
  const marsatac = makeFestival({ id: "b", name: "Marsatac" });

  it("rend la liste intacte sur une requête vide", () => {
    expect(filterFestivalsByQuery([sonores, marsatac], "  ")).toHaveLength(2);
  });

  it("ne bascule sur l'approximatif qu'en l'absence de résultat exact", () => {
    expect(filterFestivalsByQuery([sonores, marsatac], "sonores")).toEqual([sonores]);
    expect(filterFestivalsByQuery([sonores, marsatac], "sonorse")).toEqual([sonores]);
    expect(filterFestivalsByQuery([sonores, marsatac], "zzzzzzzz")).toEqual([]);
  });
});

describe("queryMatchRange", () => {
  it("repère la portion trouvée en indices du texte d'origine", () => {
    expect(queryMatchRange("Nuits Sonores", "sonores")).toEqual([6, 13]);
  });

  it("recale les indices malgré les accents", () => {
    expect(queryMatchRange("Nîmes Open Air", "nimes")).toEqual([0, 5]);
  });

  it("ne rend rien sur une requête vide", () => {
    expect(queryMatchRange("Nuits Sonores", "")).toBeNull();
  });
});

describe("applyFilters", () => {
  it("ne conserve que les événements retenus", () => {
    const a = makeFestival({ id: "a", genres: ["techno"] });
    const b = makeFestival({ id: "b", genres: ["disco"] });
    const kept = applyFilters([a, b], { ...EMPTY_FILTERS, genres: ["disco"] }, NOW);
    expect(kept.map((f) => f.id)).toEqual(["b"]);
  });
});
