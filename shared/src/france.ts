import contour from "./data/france-contour.json";

type Ring = [number, number][];

const { france, enclaves } = contour as { france: Ring[]; enclaves: Ring[] };

const WORLD_RING: Ring = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

export function franceMaskGeoJSON() {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "MultiPolygon" as const,
      coordinates: [
        [WORLD_RING, ...france],
        ...enclaves.map((ring) => [ring]),
      ],
    },
  };
}

export function franceBorderGeoJSON() {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "MultiPolygon" as const,
      coordinates: france.map((ring) => [ring]),
    },
  };
}
