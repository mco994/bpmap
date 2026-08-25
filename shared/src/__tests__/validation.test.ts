import { describe, expect, it } from "vitest";
import { FESTIVALS } from "../festivals";
import { isHttpUrl, sanitizeUrl, validateDataset } from "../validation";
import { makeFestival } from "./fixtures";

describe("isHttpUrl / sanitizeUrl", () => {
  it("n'accepte que http et https", () => {
    expect(isHttpUrl("https://bpmap.fr")).toBe(true);
    expect(isHttpUrl("http://bpmap.fr")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:text/html,<script>")).toBe(false);
    expect(isHttpUrl("//bpmap.fr")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
  });

  it("neutralise une URL non http en null", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("https://bpmap.fr")).toBe("https://bpmap.fr");
  });
});

describe("validateDataset", () => {
  it("accepte un jeu conforme", () => {
    expect(validateDataset([makeFestival()]).errors).toEqual([]);
  });

  it("refuse un identifiant ou un slug dupliqué", () => {
    const twins = [makeFestival(), makeFestival()];
    const { errors } = validateDataset(twins);
    expect(errors.some((e) => e.includes("id dupliqué"))).toBe(true);
    expect(errors.some((e) => e.includes("slug dupliqué"))).toBe(true);
  });

  it("refuse des coordonnées hors territoire français", () => {
    const { errors } = validateDataset([makeFestival({ lat: 52.5, lng: 13.4 })]);
    expect(errors.some((e) => e.includes("hors territoire"))).toBe(true);
  });

  it("refuse une date de fin antérieure au début", () => {
    const { errors } = validateDataset([
      makeFestival({ startDate: "2026-07-12", endDate: "2026-07-10" }),
    ]);
    expect(errors.some((e) => e.includes("antérieure"))).toBe(true);
  });

  it("refuse une URL non http venue de l'ingestion", () => {
    const { errors } = validateDataset([
      makeFestival({ officialUrl: "javascript:alert(document.cookie)" }),
    ]);
    expect(errors.some((e) => e.includes("officialUrl"))).toBe(true);
  });

  it("refuse une source non http", () => {
    const { errors } = validateDataset([makeFestival({ sources: ["ftp://x.test"] })]);
    expect(errors.some((e) => e.includes("source non http"))).toBe(true);
  });

  it("bloque une chute massive du jeu de données", () => {
    const previous = Array.from({ length: 100 }, (_, i) =>
      makeFestival({ id: `f${i}`, slug: `festival-${i}` }),
    );
    const current = previous.slice(0, 50);
    const { errors } = validateDataset(current, previous);
    expect(errors.some((e) => e.includes("chute anormale"))).toBe(true);
  });

  it("tolère une baisse modérée mais la signale", () => {
    const previous = Array.from({ length: 100 }, (_, i) =>
      makeFestival({ id: `f${i}`, slug: `festival-${i}` }),
    );
    const current = previous.slice(0, 90);
    const { errors, warnings } = validateDataset(current, previous);
    expect(errors).toEqual([]);
    expect(warnings[0]).toContain("10 événement(s) retiré(s)");
  });

  it("ne compare pas contre un jeu précédent trop petit", () => {
    const previous = [makeFestival()];
    expect(validateDataset([], previous).errors).toEqual([]);
  });
});

describe("jeu de données committé", () => {
  it("passe le contrôle d'intégrité", () => {
    const { errors } = validateDataset(FESTIVALS);
    expect(errors).toEqual([]);
  });

  it("n'est pas vide", () => {
    expect(FESTIVALS.length).toBeGreaterThan(0);
  });
});
