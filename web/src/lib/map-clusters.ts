import type { Festival } from "@bpmap/shared";

// Rayons dessinés par la carte, en pixels, aux paliers de zoom. Ces mêmes valeurs
// servent à construire l'expression MapLibre et à calculer le seuil de regroupement :
// une seule source de vérité, sinon les deux dérivent.
export const ZOOM_STOPS = [4, 6, 9];
export const GROUP_RADII = [7, 9, 12];
export const SINGLE_RADII = [4.5, 6, 7.5];

const TILE_SIZE = 512;

export function radiusAtZoom(zoom: number, radii: number[]): number {
  if (zoom <= ZOOM_STOPS[0]) return radii[0];
  const last = ZOOM_STOPS.length - 1;
  if (zoom >= ZOOM_STOPS[last]) return radii[last];
  const i = ZOOM_STOPS.findIndex((stop) => zoom < stop) - 1;
  const ratio = (zoom - ZOOM_STOPS[i]) / (ZOOM_STOPS[i + 1] - ZOOM_STOPS[i]);
  return radii[i] + ratio * (radii[i + 1] - radii[i]);
}

/**
 * Distance en pixels en deçà de laquelle un point est avalé par la pastille voisine.
 * Un point de rayon r à distance d d'une pastille de rayon R dépasse de d + r - R.
 * On le fusionne tant qu'il dépasse de moins d'un quart de son diamètre, soit r / 2.
 */
export function mergeDistance(zoom: number): number {
  return radiusAtZoom(zoom, GROUP_RADII) - radiusAtZoom(zoom, SINGLE_RADII) / 2;
}

/** Projection Web Mercator de MapLibre, en pixels écran au zoom donné. */
export function projectMercator(
  lng: number,
  lat: number,
  zoom: number,
): { x: number; y: number } {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const clamped = Math.max(Math.min(lat, 85.051129), -85.051129);
  const sin = Math.sin((clamped * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
  };
}

export interface Clusters {
  /** Pour l'ancre d'un groupe, la liste complète de ses membres, ancre incluse. */
  membersOf: Record<string, Festival[]>;
  /** Pour chaque événement, l'identifiant de l'ancre qui le représente. */
  anchorOf: Record<string, string>;
}

/**
 * Regroupe les événements que la carte superposerait au zoom demandé. Le premier
 * événement rencontré devient l'ancre et garde sa position exacte ; les suivants,
 * trop proches pour rester visibles, lui sont rattachés. En zoomant, le seuil se
 * resserre en pixels alors que les distances s'écartent : les groupes se défont.
 */
export function clusterByScreenDistance(
  festivals: Festival[],
  zoom: number,
): Clusters {
  const threshold = mergeDistance(zoom);
  const points = festivals.map((f) => ({ f, p: projectMercator(f.lng, f.lat, zoom) }));
  const membersOf: Record<string, Festival[]> = {};
  const anchorOf: Record<string, string> = {};
  const taken: Record<string, true> = {};

  for (const { f, p } of points) {
    if (taken[f.id]) continue;
    taken[f.id] = true;
    anchorOf[f.id] = f.id;
    const members: Festival[] = [f];
    for (const other of points) {
      if (taken[other.f.id]) continue;
      if (Math.hypot(other.p.x - p.x, other.p.y - p.y) >= threshold) continue;
      taken[other.f.id] = true;
      anchorOf[other.f.id] = f.id;
      members.push(other.f);
    }
    membersOf[f.id] = members;
  }

  return { membersOf, anchorOf };
}
