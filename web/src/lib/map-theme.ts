import {
  basemapPaintEntries,
  captureBasemapPaint,
  type PaintEntry,
  type PaintValue,
  type StyleLayerLike,
} from "@bpmap/shared";
import type { Theme } from "@/lib/theme";

export interface BasemapPaintState {
  original: PaintEntry[] | null;
  applied: Theme;
}

export interface PaintableMap {
  getStyle(): { layers?: StyleLayerLike[] } | undefined;
  setPaintProperty(layerId: string, property: string, value: PaintValue): unknown;
}

const INSTANT_TRANSITION = { duration: 0, delay: 0 };

export function syncBasemapTheme(
  map: PaintableMap,
  theme: Theme,
  state: BasemapPaintState,
  options: { instant?: boolean } = {},
): boolean {
  if (state.applied === theme) return false;
  const layers = map.getStyle()?.layers;
  if (!layers?.length) return false;
  state.original ??= captureBasemapPaint(layers);
  const transition = options.instant ? INSTANT_TRANSITION : undefined;
  for (const { layerId, property, value } of basemapPaintEntries(theme, state.original)) {
    map.setPaintProperty(layerId, `${property}-transition`, transition);
    map.setPaintProperty(layerId, property, value);
  }
  state.applied = theme;
  return true;
}
