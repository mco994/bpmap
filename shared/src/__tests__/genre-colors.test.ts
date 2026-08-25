import { describe, expect, it } from "vitest";
import { GENRES } from "../festivals";
import { GENRE_PALETTES, genreColor, genrePalette } from "../genre-colors";

const AA_TEXT = 4.5;
const WHITE = "#ffffff";

function toRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) =>
    parseInt(value.slice(offset, offset + 2), 16),
  ) as [number, number, number];
}

function toLinear(component: number): number {
  const normalized = component / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (
    (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
  );
}

describe("palette des genres", () => {
  it("couvre exactement les genres du domaine", () => {
    expect(Object.keys(GENRE_PALETTES).sort()).toEqual(
      GENRES.map((genre) => genre.slug).sort(),
    );
  });

  it("n'utilise que des couleurs hexadécimales sur six chiffres", () => {
    for (const palette of Object.values(GENRE_PALETTES)) {
      for (const color of [
        palette.light.bg,
        palette.light.fg,
        palette.dark.bg,
        palette.dark.fg,
        palette.solid,
      ]) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it.each(Object.entries(GENRE_PALETTES))(
    "%s atteint le contraste AA en clair, en sombre et en pastille pleine",
    (_slug, palette) => {
      expect(contrastRatio(palette.light.fg, palette.light.bg)).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
      expect(contrastRatio(palette.dark.fg, palette.dark.bg)).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
      expect(contrastRatio(WHITE, palette.solid)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it("retombe sur la palette techno pour un genre inconnu", () => {
    expect(genrePalette("inconnu")).toEqual(GENRE_PALETTES.techno);
    expect(genreColor("inconnu")).toBe(GENRE_PALETTES.techno.solid);
  });
});
