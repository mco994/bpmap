import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const tmp = os.tmpdir();
const files = [
  "metropole.geojson",
  "guadeloupe.geojson",
  "martinique.geojson",
  "guyane.geojson",
  "la-reunion.geojson",
  "mayotte.geojson",
];
const enclaveFiles = ["andorra.geojson", "monaco.geojson"];

const round = (n) => Math.round(n * 1000) / 1000;
const TOLERANCE = 0.005;

function perpDistance(pt, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(pt[0] - a[0], pt[1] - a[1]);
  const t = ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / (dx * dx + dy * dy);
  const c = Math.max(0, Math.min(1, t));
  return Math.hypot(pt[0] - (a[0] + c * dx), pt[1] - (a[1] + c * dy));
}

function douglasPeucker(points, tolerance) {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  const last = points.length - 1;
  for (let i = 1; i < last; i++) {
    const d = perpDistance(points[i], points[0], points[last]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= tolerance) return [points[0], points[last]];
  const left = douglasPeucker(points.slice(0, index + 1), tolerance);
  const right = douglasPeucker(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

function simplifyRing(ring, tolerance = TOLERANCE) {
  const simplified = douglasPeucker(ring, tolerance).map(([lng, lat]) => [
    round(lng),
    round(lat),
  ]);
  const out = [];
  for (const pt of simplified) {
    const prev = out[out.length - 1];
    if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) out.push(pt);
  }
  if (out.length < 4) return out;
  const first = out[0];
  const last = out[out.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) out.push([first[0], first[1]]);
  return out;
}

function polygonsOf(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  throw new Error(`Géométrie inattendue: ${geometry.type}`);
}

function outersOf(file, { tolerance, minBboxArea }) {
  const geo = JSON.parse(readFileSync(path.join(tmp, file), "utf8"));
  const geometries =
    geo.type === "FeatureCollection"
      ? geo.features.map((f) => f.geometry)
      : [geo.type === "Feature" ? geo.geometry : geo];
  const outers = [];
  for (const geometry of geometries) {
    for (const poly of polygonsOf(geometry)) {
      const outer = simplifyRing(poly[0], tolerance);
      if (outer.length < 4) continue;
      const lngs = outer.map((p) => p[0]);
      const lats = outer.map((p) => p[1]);
      const bboxArea =
        (Math.max(...lngs) - Math.min(...lngs)) * (Math.max(...lats) - Math.min(...lats));
      if (bboxArea < minBboxArea) continue;
      outers.push(outer);
    }
  }
  return outers;
}

const france = files.flatMap((f) =>
  outersOf(f, { tolerance: TOLERANCE, minBboxArea: 0.001 }),
);
const enclaves = enclaveFiles.flatMap((f) =>
  outersOf(f, { tolerance: 0.001, minBboxArea: 0 }),
);

const result = { france, enclaves };
const target = path.join(
  import.meta.dirname,
  "..",
  "..",
  "shared",
  "src",
  "data",
  "france-contour.json",
);
writeFileSync(target, JSON.stringify(result));
console.log(
  `France: ${france.length} polygones, enclaves: ${enclaves.length} → ${target} (${(JSON.stringify(result).length / 1024).toFixed(0)} Ko)`,
);
