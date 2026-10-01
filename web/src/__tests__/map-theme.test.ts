import { describe, expect, it } from "vitest";
import { NIGHT_LABELS, NIGHT_LAND, type PaintValue, type StyleLayerLike } from "@bpmap/shared";
import { syncBasemapTheme, type BasemapPaintState } from "@/lib/map-theme";

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

});
