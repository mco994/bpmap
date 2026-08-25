import { describe, expect, it } from "vitest";
import { getGenresWithCounts, getRegionsWithCounts, regionSlug } from "../seo";
import { artistSlug, getArtistsWithCounts } from "../artists";

describe("regionSlug", () => {
  it("réduit une région à un slug d'URL stable", () => {
    expect(regionSlug("Auvergne-Rhône-Alpes")).toBe("auvergne-rhone-alpes");
    expect(regionSlug("Île-de-France")).toBe("ile-de-france");
    expect(regionSlug("Provence-Alpes-Côte d'Azur")).toBe("provence-alpes-cote-d-azur");
  });

  it("traite l'apostrophe typographique comme l'apostrophe droite", () => {
    expect(regionSlug("Côte d’Azur")).toBe(regionSlug("Côte d'Azur"));
  });

  it("ne laisse ni tiret en bordure ni doublon", () => {
    expect(regionSlug("  Grand   Est  ")).toBe("grand-est");
  });
});

describe("artistSlug", () => {
  it("normalise casse, accents et ponctuation", () => {
    expect(artistSlug("Étienne de Crécy")).toBe("etienne-de-crecy");
    expect(artistSlug("A.S.Y.S.")).toBe("a-s-y-s");
    expect(artistSlug("Röyksopp & Friends")).toBe("royksopp-friends");
  });

  it("ne produit jamais de tiret en bordure", () => {
    expect(artistSlug("!!! DJ !!!")).toBe("dj");
  });
});

describe("index dérivés du jeu de données réel", () => {
  it("ne compte que des genres réellement pourvus", () => {
    for (const genre of getGenresWithCounts()) {
      expect(genre.count).toBeGreaterThan(0);
      expect(genre.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("classe les genres du plus fourni au moins fourni", () => {
    const counts = getGenresWithCounts().map((g) => g.count);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it("produit un slug de région unique par région", () => {
    const slugs = getRegionsWithCounts().map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("produit un slug d'artiste unique et non vide", () => {
    const slugs = getArtistsWithCounts().map((a) => a.slug);
    expect(slugs.every((s) => s.length > 0)).toBe(true);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
