import { describe, expect, it } from "vitest";
import { GENRES } from "../festivals";
import { GENRE_PALETTES, genreColor, genrePalette } from "../genre-colors";
import { contrastRatio } from "./contrast";

const AA_TEXT = 4.5;
const WHITE = "#ffffff";

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
