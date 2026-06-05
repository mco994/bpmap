import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { buffer } from "@turf/buffer";

const tmp = os.tmpdir();
const files = [
  "metropole.geojson",
  "guadeloupe.geojson",
  "martinique.geojson",
  "guyane.geojson",
  "la-reunion.geojson",
  "mayotte.geojson",
];

const round = (n) => Math.round(n * 1000) / 1000;
const TOLERANCE = 0.005;
const COAST_OFFSET_KM = 0.9;

const ENCLAVE_DILATE_KM = { andorra: 0.5, monaco: 0.2 };

function convexHull(points) {
  const pts = points
    .map((p) => [p[0], p[1]])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (input) => {
    const chain = [];
    for (const p of input) {
      while (
        chain.length >= 2 &&
        cross(chain[chain.length - 2], chain[chain.length - 1], p) <= 0
      ) {
        chain.pop();
      }
      chain.push(p);
    }
    chain.pop();
    return chain;
  };
  const hull = [...half(pts), ...half(pts.slice().reverse())];
  hull.push([hull[0][0], hull[0][1]]);
  return hull;
}

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

function signedArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return a / 2;
}

function dilateRing(ring, km) {
  let r = ring.slice();
  if (
    r.length > 1 &&
    r[0][0] === r[r.length - 1][0] &&
    r[0][1] === r[r.length - 1][1]
  ) {
    r = r.slice(0, -1);
  }
  const lat0 = r.reduce((s, p) => s + p[1], 0) / r.length;
  const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110.57;
  const projected = r.map((p) => [p[0] * kx, p[1] * ky]);
  const sign = signedArea(projected) > 0 ? 1 : -1;
  const n = projected.length;
  const outwardNormal = (a, b) => {
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    let nx = dy;
    let ny = -dx;
    if (sign < 0) {
      nx = -nx;
      ny = -ny;
    }
    return [nx, ny];
  };
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = projected[(i - 1 + n) % n];
    const cur = projected[i];
    const next = projected[(i + 1) % n];
    const e1 = outwardNormal(prev, cur);
    const e2 = outwardNormal(cur, next);
    let bx = e1[0] + e2[0];
    let by = e1[1] + e2[1];
    let bl = Math.hypot(bx, by);
    if (bl < 1e-9) {
      bx = e1[0];
      by = e1[1];
      bl = 1;
    }
    bx /= bl;
    by /= bl;
    const cosHalf = Math.max(0.25, bx * e1[0] + by * e1[1]);
    const miter = km / cosHalf;
    out.push([(cur[0] + bx * miter) / kx, (cur[1] + by * miter) / ky]);
  }
  out.push(out[0]);
  return out;
}

function buildEnclaves() {
  const source = JSON.parse(
    readFileSync(
      path.join(
        import.meta.dirname,
        "..",
        "..",
        "shared",
        "src",
        "data",
        "enclaves.source.json",
      ),
      "utf8",
    ),
  );
  return Object.entries(ENCLAVE_DILATE_KM).map(([name, km]) => {
    const ring = source[name];
    if (!ring) throw new Error(`Frontière manquante: ${name}`);
    return simplifyRing(dilateRing(convexHull(ring), km), 0.001);
  });
}

function polygonsOf(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  throw new Error(`Géométrie inattendue: ${geometry.type}`);
}

function bufferedOuters(outerRing) {
  const feature = {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [outerRing] },
  };
  const dilated = buffer(feature, COAST_OFFSET_KM, { units: "kilometers" });
  if (!dilated) return [];
  return polygonsOf(dilated.geometry).map((poly) => poly[0]);
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
      for (const dilatedOuter of bufferedOuters(poly[0])) {
        const outer = simplifyRing(dilatedOuter, tolerance);
        if (outer.length < 4) continue;
        const lngs = outer.map((p) => p[0]);
        const lats = outer.map((p) => p[1]);
        const bboxArea =
          (Math.max(...lngs) - Math.min(...lngs)) * (Math.max(...lats) - Math.min(...lats));
        if (bboxArea < minBboxArea) continue;
        outers.push(outer);
      }
    }
  }
  return outers;
}

const target = path.join(
  import.meta.dirname,
  "..",
  "..",
  "shared",
  "src",
  "data",
  "france-contour.json",
);

const hasFranceSources = files.every((f) => existsSync(path.join(tmp, f)));
const existing = existsSync(target)
  ? JSON.parse(readFileSync(target, "utf8"))
  : { france: [] };

const france = hasFranceSources
  ? files.flatMap((f) =>
      outersOf(f, { tolerance: TOLERANCE, minBboxArea: 0.001 }),
    )
  : existing.france;

const enclaves = buildEnclaves();

const result = { france, enclaves };
writeFileSync(target, JSON.stringify(result));
console.log(
  `France: ${france.length} polygones${hasFranceSources ? "" : " (préservés)"}, enclaves: ${enclaves.length} → ${target} (${(JSON.stringify(result).length / 1024).toFixed(0)} Ko)`,
);
