// Resident Advisor → festival lineup enrichment.
// Queries RA's GraphQL for French areas over the next months, fuzzy-matches RA
// events to our festivals (by normalized name), and merges the RA artists into
// src/data/lineups.json (dedup). Conservative matching to avoid false positives.
//
//   node scripts/ra-lineups.mjs
//
// RA_AREAS env (comma-separated RA area ids) extends coverage; default Paris=44.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "..", "shared", "src", "data");
const festivals = JSON.parse(
  readFileSync(path.join(dataDir, "festivals.json"), "utf8"),
);
const lineups = JSON.parse(readFileSync(path.join(dataDir, "lineups.json"), "utf8"));

// Map our regions to RA area ids. RA areas are city/metro-scoped; extend this
// map as we confirm more ids (only Paris=44 is verified so far).
const REGION_AREAS = {
  "Île-de-France": [44],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(s) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\bfestival\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function fetchEvents(area, gte, lte) {
  const res = await fetch("https://ra.co/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Referer: "https://ra.co/events/fr/all",
    },
    body: JSON.stringify({
      operationName: "GET_EVENT_LISTINGS",
      variables: { filters: { areas: { eq: Number(area) }, listingDate: { gte, lte } }, pageSize: 100, page: 1 },
      query:
        "query GET_EVENT_LISTINGS($filters: FilterInputDtoInput,$pageSize:Int,$page:Int){eventListings(filters:$filters,pageSize:$pageSize,page:$page){data{event{title artists{name}}}}}",
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data?.eventListings?.data ?? [];
}

const matchArtists = {}; // slug -> Set(artists)

// Targeted: for each festival with dates in a known RA area, query RA on its own
// date window (± a couple days) and match the event whose title contains the
// festival name. Far more precise than scanning months of listings.
for (const f of festivals) {
  const key = norm(f.name);
  const areas = REGION_AREAS[f.region];
  if (key.length < 7 || !areas || !f.startDate || !f.endDate) continue;
  const pad = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  };
  for (const area of areas) {
    try {
      const events = await fetchEvents(area, pad(f.startDate, -2), pad(f.endDate, 2));
      for (const { event } of events) {
        if (!norm(event.title).includes(key)) continue;
        const artists = (event.artists ?? []).map((a) => a.name).filter(Boolean);
        if (!artists.length) continue;
        (matchArtists[f.slug] ??= new Set());
        for (const a of artists) matchArtists[f.slug].add(a);
      }
    } catch {
      /* skip on error */
    }
    await sleep(300);
  }
}

let updated = 0;
for (const [slug, set] of Object.entries(matchArtists)) {
  const existing = new Set(lineups[slug] ?? []);
  const before = existing.size;
  for (const a of set) existing.add(a);
  if (existing.size > before) {
    lineups[slug] = [...existing];
    updated++;
    console.log(`✓ ${slug}: +${existing.size - before} artistes (RA)`);
  }
}

if (updated > 0) {
  writeFileSync(path.join(dataDir, "lineups.json"), JSON.stringify(lineups, null, 2) + "\n");
}
console.log(
  `\n✓ RA matching: ${Object.keys(matchArtists).length} festivals rapprochés, ${updated} enrichis (régions couvertes: ${Object.keys(REGION_AREAS).join(", ")}).`,
);
