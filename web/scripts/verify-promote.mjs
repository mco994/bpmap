import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "..", "shared", "src", "data");
const candPath = path.join(dataDir, "festivals.candidates.json");
const srcPath = path.join(dataDir, "festivals.source.json");
const lineupsPath = path.join(dataDir, "lineups.json");

if (!existsSync(candPath)) {
  console.log("· Aucun candidat (festivals.candidates.json absent).");
  process.exit(0);
}
const candidates = JSON.parse(readFileSync(candPath, "utf8"));
const source = JSON.parse(readFileSync(srcPath, "utf8"));
const lineups = JSON.parse(readFileSync(lineupsPath, "utf8"));

const ELECTRO =
  /\b(électro|electro|techno|house|trance|psytrance|hardstyle|hardcore|drum.?n.?bass|dnb|dub|disco|french touch|rave|EDM|minimal|acid)\b/i;

function normName(s) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/festival|festiv/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const knownSlugs = new Set(source.map((f) => f.slug));
const knownNames = new Set(source.map((f) => normName(f.name)));

const PARTY_PATTERN = /\sw\/\s| x | feat\.?| b2b |présente|presents|invite|closing|opening|warm.?up/i;

function domainsOf(sources = []) {
  const set = new Set();
  for (const s of sources) {
    try {
      set.add(new URL(s).hostname.replace(/^www\./, ""));
    } catch {}
  }
  return set;
}

function inferGenres(text) {
  const map = {
    techno: /\btechno\b/i,
    house: /\bhouse\b/i,
    "french-touch": /french touch/i,
    "drum-n-bass": /drum.?n.?bass|dnb|jungle/i,
    trance: /\btrance\b/i,
    psytrance: /psytrance|psy-?trance|goa/i,
    "hard-techno": /hard.?techno|hardtek/i,
    hardstyle: /hardstyle|hardcore|frenchcore|rawstyle|uptempo/i,
    electro: /\belectro\b|\bélectro/i,
    minimal: /\bminimal\b/i,
    edm: /\bedm\b|big room/i,
    disco: /\bdisco\b/i,
    dub: /\bdub\b|sound ?system/i,
    dubstep: /dubstep/i,
    ambient: /\bambient\b|experimental|expérimental/i,
  };
  const g = Object.entries(map)
    .filter(([, re]) => re.test(text))
    .map(([slug]) => slug);
  return g.length ? g : ["electro"];
}

async function officialVerified(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BPMap/1.0 (+verification)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return false;
    const body = (await res.text()).toLowerCase();
    const electroHits = (body.match(ELECTRO) || []).length;
    return electroHits >= 2 && body.includes("2026");
  } catch {
    return false;
  }
}

const promoted = [];
const rejected = [];

for (const c of candidates) {
  const slug = c.slug;
  if (knownSlugs.has(slug) || knownNames.has(normName(c.name))) {
    rejected.push({ ...c, _reason: "doublon (déjà en base)" });
    continue;
  }

  if (PARTY_PATTERN.test(c.name) || c.name.length > 55) {
    rejected.push({ ...c, _reason: "ressemble à une soirée/club, pas un festival" });
    continue;
  }

  const text = `${c.name} ${c.description ?? ""}`;
  const multiDay =
    c.startDate && c.endDate && c.endDate.slice(0, 10) > c.startDate.slice(0, 10);
  const festivalLike = /\bfestival\b/i.test(c.name) || multiDay;
  if (!festivalLike) {
    rejected.push({ ...c, _reason: "pas festival-like (ni 'festival' ni multi-jours)" });
    continue;
  }

  const hasLocation = !!c.city || (c.lat != null && c.lng != null);
  if (!hasLocation) {
    rejected.push({ ...c, _reason: "localisation manquante" });
    continue;
  }

  const genreOk = c.genreVerified || ELECTRO.test(text);
  if (!genreOk) {
    rejected.push({ ...c, _reason: "genre électro non confirmé" });
    continue;
  }

  const multiSource = domainsOf(c.sources).size >= 2;
  const named = /\bfestival\b/i.test(c.name);
  const verified = named
    ? multiSource || (await officialVerified(c.officialUrl))
    : multiSource && multiDay;
  if (!verified) {
    rejected.push({
      ...c,
      _reason: named
        ? "non vérifié (pas ≥2 sources ni site officiel confirmé)"
        : "sans 'festival' au nom → exige ≥2 sources + multi-jours",
    });
    continue;
  }

  const entry = {
    slug,
    name: c.name,
    description: c.description ?? "",
    city: c.city ?? null,
    region: c.region ?? null,
    startDate: c.startDate ?? null,
    endDate: c.endDate ?? null,
    genres: inferGenres(text),
    organizer: c.organizer ?? null,
    capacity: null,
    priceDay: null,
    priceFull: null,
    officialUrl: c.officialUrl ?? null,
    status: "announced",
    sources: c.sources ?? [],
  };
  if (c.lat != null && c.lng != null) {
    entry.lat = c.lat;
    entry.lng = c.lng;
  }
  source.push(entry);
  knownSlugs.add(slug);
  knownNames.add(normName(c.name));
  if (c.lineup?.length) lineups[slug] = c.lineup;
  promoted.push(c.name);
}

if (promoted.length > 0) {
  writeFileSync(srcPath, JSON.stringify(source, null, 2) + "\n");
  writeFileSync(lineupsPath, JSON.stringify(lineups, null, 2) + "\n");
}
writeFileSync(candPath, JSON.stringify(rejected, null, 2) + "\n");

console.log(`✓ Promus automatiquement: ${promoted.length}${promoted.length ? " (" + promoted.join(", ") + ")" : ""}`);
console.log(`· Quarantaine (rejetés): ${rejected.length}`);
