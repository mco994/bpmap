export type MapTheme = "light" | "dark";

export type PaintValue = unknown;

export type BasemapPalette = Record<string, Record<string, PaintValue>>;

export interface PaintEntry {
  layerId: string;
  property: string;
  value: PaintValue;
}

export interface StyleLayerLike {
  id: string;
  paint?: Record<string, unknown>;
}

export const NIGHT_LAND = "#1b1b20";
export const NIGHT_WATER = "#0e131c";
export const NIGHT_PARK = "#1d2220";
export const NIGHT_RESIDENTIAL = "#222228";
export const NIGHT_LABEL_HALO = "#09090b";

const NIGHT_ROAD = "#34343c";
const NIGHT_ROAD_CASING = "#45454e";
const NIGHT_RAIL = "#3a3a42";

export const NIGHT_LABELS = {
  city: "#f4f4f5",
  secondary: "#c4c4cc",
  road: "#b4b4bd",
  water: "#93a5d6",
  waterway: "#8b9bb8",
};

export const NIGHT_BASEMAP_PALETTE: BasemapPalette = {
  background: { "background-color": NIGHT_LAND },
  park: { "fill-color": NIGHT_PARK },
  water: { "fill-color": NIGHT_WATER },
  landcover_ice_shelf: { "fill-color": "#2a2a30" },
  landcover_glacier: { "fill-color": "#2a2a30" },
  landuse_residential: { "fill-color": NIGHT_RESIDENTIAL },
  landcover_wood: { "fill-color": "#1f2420" },
  waterway: { "line-color": "#1a2433" },
  building: { "fill-color": "#26262c", "fill-outline-color": "#303037" },
  tunnel_motorway_casing: { "line-color": NIGHT_RAIL },
  tunnel_motorway_inner: { "line-color": "#2a2a30" },
  "aeroway-taxiway": { "line-color": "#303037" },
  "aeroway-runway-casing": { "line-color": "#303037" },
  "aeroway-area": { "fill-color": "#26262c" },
  "aeroway-runway": { "line-color": NIGHT_RAIL },
  road_area_pier: { "fill-color": NIGHT_LAND },
  road_pier: { "line-color": NIGHT_LAND },
  highway_path: { "line-color": "#2c2c33" },
  highway_minor: { "line-color": "#2c2c33" },
  highway_major_casing: { "line-color": NIGHT_ROAD_CASING },
  highway_major_inner: { "line-color": NIGHT_ROAD },
  highway_major_subtle: { "line-color": NIGHT_ROAD },
  highway_motorway_casing: { "line-color": "#4a4a54" },
  highway_motorway_inner: {
    "line-color": ["interpolate", ["linear"], ["zoom"], 5.8, NIGHT_ROAD, 6, "#3f3f48"],
  },
  highway_motorway_subtle: { "line-color": NIGHT_ROAD },
  railway_transit: { "line-color": NIGHT_RAIL },
  railway_transit_dashline: { "line-color": NIGHT_LAND },
  railway_service: { "line-color": NIGHT_RAIL },
  railway_service_dashline: { "line-color": NIGHT_LAND },
  railway: { "line-color": NIGHT_RAIL },
  railway_dashline: { "line-color": NIGHT_LAND },
  highway_motorway_bridge_casing: { "line-color": "#4a4a54" },
  highway_motorway_bridge_inner: {
    "line-color": ["interpolate", ["linear"], ["zoom"], 5.8, NIGHT_ROAD, 6, "#3f3f48"],
  },
  boundary_3: { "line-color": "#5a5a66" },
  boundary_2: { "line-color": "#5a5a66" },
  boundary_disputed: { "line-color": "#5a5a66" },
  waterway_line_label: { "text-color": NIGHT_LABELS.waterway, "text-halo-color": NIGHT_LABEL_HALO },
  water_name_point_label: { "text-color": NIGHT_LABELS.water, "text-halo-color": NIGHT_LABEL_HALO },
  water_name_line_label: { "text-color": NIGHT_LABELS.water, "text-halo-color": NIGHT_LABEL_HALO },
  "highway-name-path": { "text-color": NIGHT_LABELS.road, "text-halo-color": NIGHT_LAND },
  "highway-name-minor": { "text-color": NIGHT_LABELS.road, "text-halo-color": NIGHT_LAND },
  "highway-name-major": { "text-color": NIGHT_LABELS.road, "text-halo-color": NIGHT_LAND },
  airport: { "text-color": NIGHT_LABELS.road, "text-halo-color": NIGHT_LABEL_HALO },
  label_other: { "text-color": NIGHT_LABELS.secondary, "text-halo-color": NIGHT_LABEL_HALO },
  label_village: { "text-color": NIGHT_LABELS.city, "text-halo-color": NIGHT_LABEL_HALO },
  label_town: { "text-color": NIGHT_LABELS.city, "text-halo-color": NIGHT_LABEL_HALO },
  label_state: { "text-color": NIGHT_LABELS.secondary, "text-halo-color": NIGHT_LABEL_HALO },
  label_city: { "text-color": NIGHT_LABELS.city, "text-halo-color": NIGHT_LABEL_HALO },
  label_city_capital: { "text-color": NIGHT_LABELS.city, "text-halo-color": NIGHT_LABEL_HALO },
  label_country_3: { "text-color": NIGHT_LABELS.city, "text-halo-color": NIGHT_LABEL_HALO },
  label_country_2: { "text-color": NIGHT_LABELS.city, "text-halo-color": NIGHT_LABEL_HALO },
  label_country_1: { "text-color": NIGHT_LABELS.city, "text-halo-color": NIGHT_LABEL_HALO },
};

export interface OverlayColors {
  mask: string;
  maskOpacity: number;
  border: string;
  borderOpacity: number;
  point: string;
  pointStroke: string;
  countText: string;
  countHalo: string;
  selected: string;
  selectedStroke: string;
}

export const OVERLAY_COLORS: Record<MapTheme, OverlayColors> = {
  light: {
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
  },
  dark: {
    mask: "#0b0b0e",
    maskOpacity: 0.93,
    border: "#e879f9",
    borderOpacity: 0.6,
    point: "#ec4899",
    pointStroke: "#fce7f3",
    countText: "#ffffff",
    countHalo: "#831843",
    selected: "#f9a8d4",
    selectedStroke: "#fdf2f8",
  },
};

export function captureBasemapPaint(
  layers: readonly StyleLayerLike[],
  palette: BasemapPalette = NIGHT_BASEMAP_PALETTE,
): PaintEntry[] {
  return layers.flatMap((layer) =>
    Object.keys(palette[layer.id] ?? {}).map((property) => ({
      layerId: layer.id,
      property,
      value: layer.paint?.[property],
    })),
  );
}

export function basemapPaintEntries(
  theme: MapTheme,
  original: readonly PaintEntry[],
  palette: BasemapPalette = NIGHT_BASEMAP_PALETTE,
): PaintEntry[] {
  if (theme === "light") return [...original];
  return original.map(({ layerId, property }) => ({
    layerId,
    property,
    value: palette[layerId][property],
  }));
}

