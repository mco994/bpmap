import { describe, expect, it } from "vitest";
import { festivalIcs } from "../ics";
import { makeFestival } from "./fixtures";

function field(ics: string, name: string): string | undefined {
  return ics
    .split("\r\n")
    .find((line) => line.startsWith(`${name}:`) || line.startsWith(`${name};`));
}

describe("festivalIcs", () => {
  it("rend une chaîne vide sans date de début", () => {
    expect(festivalIcs(makeFestival({ startDate: null }))).toBe("");
  });

  it("produit un VCALENDAR complet terminé par CRLF", () => {
    const ics = festivalIcs(makeFestival());
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("pose un DTEND exclusif, au lendemain du dernier jour", () => {
    const ics = festivalIcs(makeFestival({ startDate: "2026-07-10", endDate: "2026-07-12" }));
    expect(field(ics, "DTSTART")).toBe("DTSTART;VALUE=DATE:20260710");
    expect(field(ics, "DTEND")).toBe("DTEND;VALUE=DATE:20260713");
  });

  it("gère le passage de mois sur le DTEND", () => {
    const ics = festivalIcs(makeFestival({ startDate: "2026-07-30", endDate: "2026-07-31" }));
    expect(field(ics, "DTEND")).toBe("DTEND;VALUE=DATE:20260801");
  });

  it("traite un événement d'un seul jour", () => {
    const ics = festivalIcs(makeFestival({ startDate: "2026-07-10", endDate: null }));
    expect(field(ics, "DTEND")).toBe("DTEND;VALUE=DATE:20260711");
  });

  it("échappe virgules, points-virgules et retours à la ligne", () => {
    const ics = festivalIcs(
      makeFestival({ name: "Nuit; Sonore, Lyon", description: "Ligne 1\nLigne 2" }),
    );
    expect(field(ics, "SUMMARY")).toBe(String.raw`SUMMARY:Nuit\; Sonore\, Lyon`);
    expect(field(ics, "DESCRIPTION")).toContain(String.raw`Ligne 1\nLigne 2`);
  });

  it("n'ajoute l'URL que si le site est fourni", () => {
    expect(field(festivalIcs(makeFestival()), "URL")).toBeUndefined();
    const ics = festivalIcs(makeFestival(), "https://bpmap.fr/");
    expect(field(ics, "URL")).toBe("URL:https://bpmap.fr/festivals/festival-test");
  });

  it("compose le lieu depuis la ville et la région", () => {
    expect(field(festivalIcs(makeFestival()), "LOCATION")).toBe(
      String.raw`LOCATION:Lyon\, Auvergne-Rhône-Alpes`,
    );
  });
});
