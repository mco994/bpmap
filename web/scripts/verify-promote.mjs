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
  /(?<![\p{L}\d])(électro|electro|techno|house|trance|psytrance|hardstyle|hardcore|drum.?n.?bass|dnb|dub|disco|french touch|rave|EDM|minimal|acid)(?![\p{L}\d])/iu;

function normName(s) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/festival|festiv/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const ELECTRO_GLOBAL = new RegExp(ELECTRO.source, "giu");
const CURRENT_YEAR = new Date().getFullYear();
const UPCOMING_YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1].map(String);

const knownSlugs = new Set(source.map((f) => f.slug));
const knownNames = new Set(source.map((f) => normName(f.name)));

function datesOverlap(a, b) {
  const aStart = (a.startDate ?? "").slice(0, 10);
  const aEnd = (a.endDate ?? a.startDate ?? "").slice(0, 10);
  const bStart = (b.startDate ?? "").slice(0, 10);
  const bEnd = (b.endDate ?? b.startDate ?? "").slice(0, 10);
  if (!aStart || !bStart) return false;
  return aStart <= bEnd && bStart <= aEnd;
}

function variantOfKnown(candidate) {
  const name = normName(candidate.name);
  return source.find((f) => {
    const known = normName(f.name);
    if (!known || !name) return false;
    const related = name.startsWith(known) || known.startsWith(name);
    return related && datesOverlap(f, candidate);
  });
}

const NON_ELECTRO =
  /(?<![\p{L}\d])(jazz|classique|classical|symphoni|opéra|opera|rock|metal|punk|hip.?hop|rap|reggae|blues|folk|chanson|gospel|country|salsa|flamenco)(?![\p{L}\d])/iu;

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

const MAX_BODY_BYTES = 512 * 1024;

function isHttp(url) {
  return /^https?:\/\//i.test(url ?? "");
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function readCapped(res) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  while (text.length < MAX_BODY_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  await reader.cancel().catch(() => {});
  return text;
}

async function officialVerified(url, sourceDomains) {
  if (!isHttp(url)) return false;
  const host = hostnameOf(url);
  if (!host || sourceDomains.has(host)) return false;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BPMap/1.0 (+verification)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return false;
    const body = (await readCapped(res)).toLowerCase();
    const electroHits = (body.match(ELECTRO_GLOBAL) || []).length;
    return electroHits >= 2 && UPCOMING_YEARS.some((year) => body.includes(year));
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

  const variantOf = variantOfKnown(c);
  if (variantOf) {
    rejected.push({ ...c, _reason: `variante billetterie de « ${variantOf.name} » (mêmes dates)` });
    continue;
  }

  if (PARTY_PATTERN.test(c.name) || c.name.length > 55) {
    rejected.push({ ...c, _reason: "ressemble à une soirée/club, pas un festival" });
    continue;
  }

  const text = `${c.name} ${c.description ?? ""}`;
  const multiDay =
    c.startDate && c.endDate && c.endDate.slice(0, 10) > c.startDate.slice(0, 10);
  const festivalLike =
    c.isFestival === true || /\bfestival\b|open.?air/i.test(c.name) || multiDay;
  if (!festivalLike) {
    rejected.push({ ...c, _reason: "pas festival-like (ni 'festival' ni multi-jours)" });
    continue;
  }

  const hasLocation = !!c.city || (c.lat != null && c.lng != null);
  if (!hasLocation) {
    rejected.push({ ...c, _reason: "localisation manquante" });
    continue;
  }

  const genreOk = (c.genreVerified || ELECTRO.test(text)) && !NON_ELECTRO.test(c.name);
  if (!genreOk) {
    rejected.push({ ...c, _reason: "genre électro non confirmé" });
    continue;
  }

  const sourceDomains = domainsOf(c.sources);
  const multiSource = sourceDomains.size >= 2;
  const named = c.isFestival === true || /\bfestival\b|open.?air/i.test(c.name);
  const curated = c.isFestival === true || (named && sourceDomains.has("ra.co"));
  const verified =
    curated ||
    (named
      ? multiSource || (await officialVerified(c.officialUrl, sourceDomains))
      : multiSource && multiDay);
  if (!verified) {
    rejected.push({
      ...c,
      _reason: named
        ? "non vérifié (pas ≥2 sources, ni festival RA, ni site officiel indépendant confirmé)"
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
    officialUrl: isHttp(c.officialUrl) ? c.officialUrl : null,
    status: "announced",
    sources: (c.sources ?? []).filter(isHttp),
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

function compactLines(entries) {
  return "[\n" + entries.map((entry) => "  " + JSON.stringify(entry)).join(",\n") + "\n]\n";
}

if (promoted.length > 0) {
  writeFileSync(srcPath, compactLines(source));
  writeFileSync(lineupsPath, JSON.stringify(lineups, null, 2) + "\n");
}
writeFileSync(candPath, JSON.stringify(rejected, null, 2) + "\n");

console.log(`✓ Promus automatiquement: ${promoted.length}${promoted.length ? " (" + promoted.join(", ") + ")" : ""}`);
console.log(`· Quarantaine (rejetés): ${rejected.length}`);
