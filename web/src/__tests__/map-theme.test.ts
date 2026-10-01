import { describe, expect, it } from "vitest";
import {
  NIGHT_BASEMAP_PALETTE,
  NIGHT_LABELS,
  NIGHT_LABEL_HALO,
  NIGHT_LAND,
  NIGHT_PARK,
  NIGHT_RESIDENTIAL,
  NIGHT_WATER,
  OVERLAY_COLORS,
  basemapPaintEntries,
  captureBasemapPaint,
  syncBasemapTheme,
  type BasemapPaintState,
  type PaintValue,
  type StyleLayerLike,
} from "@/lib/map-theme";

const AA_TEXT = 4.5;
const AA_GRAPHIC = 3;

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

function blend(foreground: string, background: string, alpha: number): string {
  return `#${[1, 3, 5]
    .map((i) => {
      const fg = parseInt(foreground.slice(i, i + 2), 16);
      const bg = parseInt(background.slice(i, i + 2), 16);
      return Math.round(fg * alpha + bg * (1 - alpha))
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

const POSITRON_EXCERPT: StyleLayerLike[] = [
  { id: "background", paint: { "background-color": "rgb(242,243,240)" } },
  { id: "water", paint: { "fill-color": "rgb(194, 200, 202)" } },
  { id: "highway-name-minor", paint: { "text-color": "#666" } },
  { id: "label_city", paint: { "text-color": "#000", "text-halo-color": "#fff" } },
  { id: "france-mask", paint: { "fill-color": "#f6f0f7" } },
];

function fakeMap(layers: StyleLayerLike[] = POSITRON_EXCERPT) {
  const paint = new Map<string, PaintValue>();
  const calls: string[] = [];
  return {
    paint,
    calls,
    getStyle: () => ({ layers }),
    setPaintProperty(layerId: string, property: string, value: PaintValue) {
      calls.push(`${layerId}.${property}`);
      paint.set(`${layerId}.${property}`, value);
    },
  };
}

describe("fond de carte nuit", () => {
  it("ne modifie que des propriétés de couleur", () => {
    for (const properties of Object.values(NIGHT_BASEMAP_PALETTE)) {
      for (const property of Object.keys(properties)) {
        expect(property).toMatch(/-color$/);
      }
    }
  });

  it("capture les valeurs d'origine des seuls calques du fond présents", () => {
    const captured = captureBasemapPaint(POSITRON_EXCERPT);
    expect(captured).toContainEqual({ layerId: "label_city", property: "text-color", value: "#000" });
    expect(captured).toContainEqual({
      layerId: "highway-name-minor",
      property: "text-halo-color",
      value: undefined,
    });
    expect(captured.some((entry) => entry.layerId === "france-mask")).toBe(false);
  });

  it("reste intact en mode jour au chargement", () => {
    const map = fakeMap();
    const state: BasemapPaintState = { original: null, applied: "light" };
    expect(syncBasemapTheme(map, "light", state)).toBe(false);
    expect(map.calls).toEqual([]);
  });

  it("repeint en nuit puis restaure exactement les valeurs de jour", () => {
    const map = fakeMap();
    const state: BasemapPaintState = { original: null, applied: "light" };

    expect(syncBasemapTheme(map, "dark", state)).toBe(true);
    expect(map.paint.get("background.background-color")).toBe(NIGHT_LAND);
    expect(map.paint.get("label_city.text-color")).toBe(NIGHT_LABELS.city);
    expect(syncBasemapTheme(map, "dark", state)).toBe(false);

    expect(syncBasemapTheme(map, "light", state)).toBe(true);
    expect(map.paint.get("background.background-color")).toBe("rgb(242,243,240)");
    expect(map.paint.get("label_city.text-color")).toBe("#000");
    expect(map.paint.get("highway-name-minor.text-halo-color")).toBeUndefined();
  });

  it("repeint sans fondu au chargement et avec le fondu par défaut ensuite", () => {
    const map = fakeMap();
    const state: BasemapPaintState = { original: null, applied: "light" };
    syncBasemapTheme(map, "dark", state, { instant: true });
    expect(map.paint.get("background.background-color-transition")).toEqual({ duration: 0, delay: 0 });
    syncBasemapTheme(map, "light", state);
    expect(map.paint.get("background.background-color-transition")).toBeUndefined();
    expect(map.paint.has("background.background-color-transition")).toBe(true);
  });

  it("attend que le style soit chargé avant de repeindre", () => {
    const map = fakeMap([]);
    const state: BasemapPaintState = { original: null, applied: "light" };
    expect(syncBasemapTheme(map, "dark", state)).toBe(false);
    expect(state.applied).toBe("light");
  });

  it("donne en nuit une entrée par valeur capturée", () => {
    const original = captureBasemapPaint(POSITRON_EXCERPT);
    const night = basemapPaintEntries("dark", original);
    expect(night.map(({ layerId, property }) => `${layerId}.${property}`)).toEqual(
      original.map(({ layerId, property }) => `${layerId}.${property}`),
    );
  });

  it.each([
    ["villes", NIGHT_LABELS.city],
    ["libellés secondaires", NIGHT_LABELS.secondary],
    ["noms de routes", NIGHT_LABELS.road],
    ["noms d'eau", NIGHT_LABELS.water],
    ["cours d'eau", NIGHT_LABELS.waterway],
  ])("%s lisibles sur la terre et sur leur halo (≥ 4,5)", (_label, color) => {
    expect(contrastRatio(color, NIGHT_LAND)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(color, NIGHT_LABEL_HALO)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("noms d'eau lisibles sur l'eau (≥ 4,5)", () => {
    expect(contrastRatio(NIGHT_LABELS.water, NIGHT_WATER)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe("pastilles et calques superposés", () => {
  it("garde en jour les couleurs d'origine", () => {
    expect(OVERLAY_COLORS.light).toEqual({
      mask: "#f6f0f7",
      maskOpacity: 0.93,
      border: "#c026d3",
      borderOpacity: 0.35,
      point: "#db2777",
      pointStroke: "#ffffff",
      countText: "#ffffff",
      countHalo: "#9d174d",
      selected: "#9d174d",
      selectedStroke: "#ffffff",
    });
  });

  it("garde l'opacité du masque entre jour et nuit", () => {
    expect(OVERLAY_COLORS.dark.maskOpacity).toBe(OVERLAY_COLORS.light.maskOpacity);
  });

  const night = OVERLAY_COLORS.dark;
  const maskedLand = blend(night.mask, NIGHT_LAND, night.maskOpacity);
  const backgrounds: [string, string][] = [
    ["terre", NIGHT_LAND],
    ["eau", NIGHT_WATER],
    ["parcs", NIGHT_PARK],
    ["zones habitées", NIGHT_RESIDENTIAL],
    ["hors France masqué", maskedLand],
  ];

  it.each(backgrounds)("pastille, contour et sélection visibles sur %s (≥ 3)", (_label, background) => {
    expect(contrastRatio(night.point, background)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    expect(contrastRatio(night.pointStroke, background)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    expect(contrastRatio(night.selected, background)).toBeGreaterThanOrEqual(AA_GRAPHIC);
  });

  it("compteur des regroupements lisible sur son halo (≥ 4,5)", () => {
    expect(contrastRatio(night.countText, night.countHalo)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("frontière de la France visible sur la terre et sur le masque (≥ 3)", () => {
    for (const background of [NIGHT_LAND, maskedLand]) {
      const border = blend(night.border, background, night.borderOpacity);
      expect(contrastRatio(border, background)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    }
  });
});

describe("bulle d'événement en nuit", () => {
  const POPUP = "#18181b";
  const FUCHSIA_950 = "#4b004f";
  it.each([
    ["titre zinc-50", "#fafafa", POPUP],
    ["texte zinc-200", "#e4e4e7", POPUP],
    ["texte zinc-300", "#d4d4d8", POPUP],
    ["texte zinc-400", "#9f9fa9", POPUP],
    ["liens fuchsia-300", "#f4a8ff", POPUP],
    ["regroupement fuchsia-100", "#fae8ff", FUCHSIA_950],
    ["regroupement fuchsia-200", "#f6cfff", FUCHSIA_950],
    ["regroupement fuchsia-300", "#f4a8ff", FUCHSIA_950],
    ["regroupement zinc-300", "#d4d4d8", FUCHSIA_950],
  ])("%s ≥ 4,5", (_label, text, background) => {
    expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
