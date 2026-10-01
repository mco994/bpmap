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
  themeBasemapStyle,
  type StyleLayerLike,
} from "../map-theme";
import { blend, contrastRatio } from "./contrast";

const AA_TEXT = 4.5;
const AA_GRAPHIC = 3;

const POSITRON_EXCERPT: StyleLayerLike[] = [
  { id: "background", paint: { "background-color": "rgb(242,243,240)" } },
  { id: "water", paint: { "fill-color": "rgb(194, 200, 202)" } },
  { id: "highway-name-minor", paint: { "text-color": "#666" } },
  { id: "label_city", paint: { "text-color": "#000", "text-halo-color": "#fff" } },
  { id: "france-mask", paint: { "fill-color": "#f6f0f7" } },
];

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

describe("style de fond injecté pour l'application", () => {
  const style = {
    version: 8,
    sources: { openmaptiles: { type: "vector" } },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "rgb(242,243,240)" } },
      {
        id: "label_city",
        type: "symbol",
        filter: ["==", "class", "city"],
        layout: { "text-field": "{name}" },
        paint: { "text-color": "#000", "text-halo-color": "#fff", "text-halo-width": 1.2 },
      },
      { id: "highway-name-minor", type: "symbol", paint: { "text-color": "#666" } },
      { id: "france-mask", type: "fill", paint: { "fill-color": "#f6f0f7" } },
    ],
  };

  it("rend le style tel quel en jour", () => {
    expect(themeBasemapStyle(style, "light")).toBe(style);
  });

  it("ne recolore en nuit que les couleurs des calques du fond", () => {
    const night = themeBasemapStyle(style, "dark");
    expect(night.sources).toBe(style.sources);
    expect(night.layers.map((layer) => layer.id)).toEqual(style.layers.map((layer) => layer.id));
    expect(night.layers[0].paint).toEqual({ "background-color": NIGHT_LAND });
    expect(night.layers[1]).toEqual({
      ...style.layers[1],
      paint: { "text-color": NIGHT_LABELS.city, "text-halo-color": NIGHT_LABEL_HALO, "text-halo-width": 1.2 },
    });
    expect(night.layers[2].paint).toEqual({ "text-color": NIGHT_LABELS.road, "text-halo-color": NIGHT_LAND });
    expect(night.layers[3]).toBe(style.layers[3]);
  });

  it("applique en nuit les mêmes valeurs que le repeint du web", () => {
    const night = themeBasemapStyle(style, "dark");
    const entries = basemapPaintEntries("dark", captureBasemapPaint(style.layers));
    for (const { layerId, property, value } of entries) {
      const layer = night.layers.find((candidate) => candidate.id === layerId);
      expect(layer?.paint?.[property as keyof typeof layer.paint]).toEqual(value);
    }
  });

  it("ne modifie pas le style d'origine", () => {
    const before = JSON.stringify(style);
    themeBasemapStyle(style, "dark");
    expect(JSON.stringify(style)).toBe(before);
  });

  it("garde les couleurs de jour de l'application à l'identique", () => {
    const appDay = {
      mask: "#f6f0f7",
      maskOpacity: 0.93,
      border: "#c026d3",
      borderOpacity: 0.35,
      point: "#DB2777",
      pointStroke: "#ffffff",
      selected: "#9D174D",
      selectedStroke: "#ffffff",
    };
    const day = OVERLAY_COLORS.light;
    for (const [key, value] of Object.entries(appDay)) {
      const shared = day[key as keyof typeof day];
      expect(typeof value === "string" ? value.toLowerCase() : value).toBe(shared);
    }
  });
});
