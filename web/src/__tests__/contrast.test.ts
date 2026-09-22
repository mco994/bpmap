import { describe, expect, it } from "vitest";

const ZINC = {
  white: "#ffffff",
  400: "#9f9fa9",
  500: "#71717b",
  600: "#52525c",
  950: "#09090b",
};

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("contrastes des textes secondaires", () => {
  it("texte secondaire sombre : zinc-400 sur zinc-950 ≥ 4,5", () => {
    expect(contrastRatio(ZINC[400], ZINC[950])).toBeGreaterThanOrEqual(4.5);
  });

  it("texte secondaire clair : zinc-500 sur blanc ≥ 4,5", () => {
    expect(contrastRatio(ZINC[500], ZINC.white)).toBeGreaterThanOrEqual(4.5);
  });

  it("icône de bascule non active : zinc-500 sur blanc ≥ 3", () => {
    expect(contrastRatio(ZINC[500], ZINC.white)).toBeGreaterThanOrEqual(3);
  });

  it("l'ancienne paire zinc-500 sur zinc-950 échouait bien", () => {
    expect(contrastRatio(ZINC[500], ZINC[950])).toBeLessThan(4.5);
  });
});
