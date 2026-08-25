import { describe, expect, it } from "vitest";
import { groupByLetter, groupByMonth, sortByDateThenName } from "../grouping";
import { haversineKm } from "../distance";
import { directionsUrl } from "../geo";
import { makeFestival } from "./fixtures";

describe("sortByDateThenName", () => {
  it("trie par date puis par nom et repousse les événements sans date", () => {
    const undated = makeFestival({ id: "z", name: "Sans date", startDate: null, endDate: null });
    const july = makeFestival({ id: "b", name: "Bêta", startDate: "2026-07-10" });
    const june = makeFestival({ id: "a", name: "Alpha", startDate: "2026-06-10" });
    const juneBis = makeFestival({ id: "c", name: "Zêta", startDate: "2026-06-10" });
    const sorted = sortByDateThenName([undated, july, juneBis, june]);
    expect(sorted.map((f) => f.id)).toEqual(["a", "c", "b", "z"]);
  });

  it("ne modifie pas le tableau reçu", () => {
    const input = [makeFestival({ id: "b", startDate: "2026-07-10" }), makeFestival({ id: "a", startDate: "2026-06-10" })];
    sortByDateThenName(input);
    expect(input.map((f) => f.id)).toEqual(["b", "a"]);
  });
});

describe("groupByMonth", () => {
  it("regroupe par mois avec un titre en français capitalisé", () => {
    const sections = groupByMonth([
      makeFestival({ id: "a", startDate: "2026-06-10", endDate: "2026-06-11" }),
      makeFestival({ id: "b", startDate: "2026-07-10", endDate: "2026-07-11" }),
    ]);
    expect(sections.map((s) => s.title)).toEqual(["Juin 2026", "Juillet 2026"]);
  });

  it("place les événements sans date dans une section finale dédiée", () => {
    const sections = groupByMonth([
      makeFestival({ id: "z", startDate: null, endDate: null }),
      makeFestival({ id: "a", startDate: "2026-06-10" }),
    ]);
    expect(sections.at(-1)).toMatchObject({ key: "undated", title: "Date à confirmer" });
  });
});

describe("groupByLetter", () => {
  it("regroupe par initiale en ignorant les accents", () => {
    const sections = groupByLetter([
      makeFestival({ id: "e", name: "Électro Park" }),
      makeFestival({ id: "a", name: "Astropolis" }),
    ]);
    expect(sections.map((s) => s.key)).toEqual(["A", "E"]);
  });

  it("renvoie les noms non alphabétiques en fin de liste", () => {
    const sections = groupByLetter([
      makeFestival({ id: "n", name: "1988 Live Club" }),
      makeFestival({ id: "a", name: "Astropolis" }),
    ]);
    expect(sections.map((s) => s.key)).toEqual(["A", "#"]);
  });
});

describe("haversineKm", () => {
  it("rend zéro entre un point et lui-même", () => {
    expect(haversineKm({ lat: 45, lng: 4 }, { lat: 45, lng: 4 })).toBe(0);
  });

  it("approche la distance Paris–Marseille au kilomètre près", () => {
    const km = haversineKm({ lat: 48.8566, lng: 2.3522 }, { lat: 43.2965, lng: 5.3698 });
    expect(km).toBeGreaterThan(655);
    expect(km).toBeLessThan(665);
  });
});

describe("directionsUrl", () => {
  it("cible la destination sans origine par défaut", () => {
    const url = new URL(directionsUrl(makeFestival({ lat: 45.5, lng: 4.5 })));
    expect(url.searchParams.get("destination")).toBe("45.5,4.5");
    expect(url.searchParams.get("origin")).toBeNull();
  });

  it("accepte une origine en coordonnées ou en texte", () => {
    expect(directionsUrl(makeFestival(), { lat: 48.85, lng: 2.35 })).toContain("origin=48.85,2.35");
    expect(directionsUrl(makeFestival(), "12 rue de la Paix, Paris")).toContain(
      `origin=${encodeURIComponent("12 rue de la Paix, Paris")}`,
    );
  });

  it("ignore une origine textuelle vide", () => {
    expect(directionsUrl(makeFestival(), "   ")).not.toContain("origin=");
  });
});
