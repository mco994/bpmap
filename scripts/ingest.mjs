// Ingestion (discovery) — WORK IN PROGRESS skeleton.
//
// Goal: pull candidate festivals from open-data sources, keep only the
// electronic-dominant French multi-day ones, drop those we already have, and
// write them to festivals.candidates.json for HUMAN REVIEW before they are
// promoted into the curated festivals.source.json. We never auto-publish
// unreviewed data (rigor requirement).
//
//   node scripts/ingest.mjs
//
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import AdmZip from "adm-zip";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "src", "data");
const source = JSON.parse(
  readFileSync(path.join(dataDir, "festivals.source.json"), "utf8"),
);
const known = new Set(source.map((f) => f.slug));

// Loose electro keyword gate for the description/title. The real ≥60% rule is
// applied later by a human (and eventually by lineup genre classification).
const ELECTRO_HINTS =
  /\b(électro|electro|techno|house|trance|psytrance|hardstyle|hardcore|drum.?n.?bass|dnb|dub|disco|french touch|rave|EDM|minimal)\b/i;

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Connectors (TODO) -----------------------------------------------------
// Each returns an array of raw candidates: { name, city, region, startDate?,
// endDate?, description?, officialUrl?, sources: [...] }.

// DATAtourisme — official open-data API (free, requires registration). Set
// DATATOURISME_FLUX_URL (the per-application JSON flux URL incl. your API key)
// in the environment. Without it the connector is skipped.
// Docs: https://info.datatourisme.fr/ — the flux serves JSON-LD POIs.
async function fetchDatatourisme() {
  const fluxUrl = process.env.DATATOURISME_FLUX_URL;
  if (!fluxUrl || fluxUrl.includes("{app_key}")) {
    console.log("· DATAtourisme: ignoré (DATATOURISME_FLUX_URL non défini ou {app_key} non remplacé)");
    return [];
  }

  const arr = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);
  // JSON-LD values are multilingual ({@language,@value}) or nested objects.
  const label = (v) => {
    if (v == null) return null;
    if (typeof v === "string") return v;
    if (Array.isArray(v)) {
      const fr = v.find((x) => x && x["@language"] === "fr") ?? v[0];
      return typeof fr === "string" ? fr : (fr?.["@value"] ?? null);
    }
    if (v["@value"] != null) return v["@value"];
    if (v.fr != null) return label(v.fr);
    const first = Object.values(v)[0];
    return first != null ? label(first) : null;
  };
  const num = (v) => {
    const n = Number(label(v) ?? v);
    return Number.isFinite(n) ? n : null;
  };
  const today = new Date().toISOString().slice(0, 10);

  try {
    const res = await fetch(fluxUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
    const idx = zip.getEntry("index.json");
    const files = idx
      ? JSON.parse(idx.getData().toString("utf8")).map((it) => it.file ?? it)
      : zip
          .getEntries()
          .map((e) => e.entryName)
          .filter((n) => n.endsWith(".json") && !/index\.json|context\.json/.test(n));

    const out = [];
    for (const file of files) {
      try {
        const entry = zip.getEntry(file);
        if (!entry) continue;
        const poi = JSON.parse(entry.getData().toString("utf8"));
        const name = label(poi["rdfs:label"]);
        if (!name) continue;
        const loc = arr(poi.isLocatedAt)[0] ?? {};
        const address = arr(loc["schema:address"])[0] ?? {};
        const geo = loc["schema:geo"] ?? {};
        let startDate = null;
        let endDate = null;
        for (const p of arr(poi.takesPlaceAt)) {
          const s = (label(p.startDate ?? p["schema:startDate"]) ?? "").slice(0, 10);
          const e = (label(p.endDate ?? p["schema:endDate"]) ?? "").slice(0, 10);
          if (s && (!startDate || s < startDate)) startDate = s;
          if (e && (!endDate || e > endDate)) endDate = e;
        }
        if (endDate && endDate < today) continue; // skip finished events
        out.push({
          name,
          city: label(address["schema:addressLocality"]),
          region: null,
          description: label(poi["rdfs:comment"]) ?? "",
          startDate,
          endDate,
          lat: num(geo["schema:latitude"]),
          lng: num(geo["schema:longitude"]),
          officialUrl: label(poi["foaf:homepage"]),
          sources: [poi["@id"]].filter(Boolean),
          genreVerified: false,
        });
      } catch {
        /* skip malformed POI */
      }
    }
    console.log(`· DATAtourisme: ${out.length} événements à venir récupérés`);
    return out;
  } catch (err) {
    console.warn("· DATAtourisme: échec —", err.message);
    return [];
  }
}

// Resident Advisor — unofficial GraphQL endpoint (no key). Best electro source.
// Used for discovery + lineups. Returns events with artists for FR areas over
// the next months; we keep festival-like events (title "festival" or ≥6 artists).
async function fetchResidentAdvisor() {
  const AREAS = [44]; // 44 = Paris (verified). TODO: add more FR RA area ids.
  const today = new Date();
  const gte = today.toISOString().slice(0, 10);
  const end = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
  const lte = end.toISOString().slice(0, 10);
  const query =
    "query GET_EVENT_LISTINGS($filters: FilterInputDtoInput,$pageSize:Int,$page:Int){eventListings(filters:$filters,pageSize:$pageSize,page:$page){data{event{id title date contentUrl venue{name} artists{name}}}}}";
  const out = [];
  for (const area of AREAS) {
    try {
      const res = await fetch("https://ra.co/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Referer: "https://ra.co/events/fr/all",
        },
        body: JSON.stringify({
          operationName: "GET_EVENT_LISTINGS",
          variables: { filters: { areas: { eq: area }, listingDate: { gte, lte } }, pageSize: 50, page: 1 },
          query,
        }),
      });
      if (!res.ok) continue;
      const json = await res.json();
      for (const it of json.data?.eventListings?.data ?? []) {
        const e = it.event;
        const artists = (e.artists ?? []).map((a) => a.name);
        const isFestival = /festival/i.test(e.title) || artists.length >= 6;
        if (!isFestival) continue;
        const url = e.contentUrl ? `https://ra.co${e.contentUrl}` : null;
        out.push({
          name: e.title,
          city: null,
          region: null,
          startDate: e.date ? e.date.slice(0, 10) : null,
          endDate: null,
          officialUrl: url,
          lineup: artists,
          genreVerified: true, // RA is an electronic-music platform
          sources: [url ?? "https://ra.co"],
        });
      }
    } catch {
      /* network/area error → skip this area */
    }
  }
  return out;
}

// OpenAgenda — public events via the Opendatasoft Explore API v2.1 (no key).
// Keeps upcoming, multi-day, France events matching electro keywords. Results
// are coarse (full-text match) → the ELECTRO_HINTS gate + human review refine.
async function fetchOpenAgenda() {
  const base =
    "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records";
  const where =
    '("festival") and ("techno" or "électro" or "house" or "trance" or "drum and bass" or "hardstyle" or "psytrance") and location_countrycode="FR" and firstdate_begin >= now()';
  const params = new URLSearchParams({
    where,
    limit: "100",
    order_by: "firstdate_begin",
    select:
      "title_fr,description_fr,location_city,location_region,location_coordinates,firstdate_begin,lastdate_end,canonicalurl",
  });
  const res = await fetch(`${base}?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`OpenAgenda HTTP ${res.status}`);
  const json = await res.json();
  const strip = (s) =>
    (s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
  const day = (s) => (s ?? "").slice(0, 10);

  return (json.results ?? [])
    .filter((r) => r.title_fr && r.firstdate_begin)
    .filter((r) => day(r.lastdate_end) > day(r.firstdate_begin)) // multi-day only
    .map((r) => ({
      name: r.title_fr,
      city: r.location_city ?? null,
      region: r.location_region ?? null,
      description: strip(r.description_fr),
      startDate: day(r.firstdate_begin) || null,
      endDate: day(r.lastdate_end) || null,
      lat: r.location_coordinates?.lat ?? null,
      lng: r.location_coordinates?.lon ?? null,
      officialUrl: r.canonicalurl ?? null,
      sources: [r.canonicalurl].filter(Boolean),
      genreVerified: false, // keyword-only → keep the keyword gate + human review
    }));
}

// Wikidata — SPARQL: music festivals located in France whose genre is
// (a subclass of) electronic music. Structured, no API key, high precision for
// established festivals. Genre is verified by the query itself.
async function fetchWikidata() {
  const query = `
    SELECT DISTINCT ?f ?fLabel ?coord ?site ?placeLabel WHERE {
      ?f wdt:P31/wdt:P279* wd:Q868557 .   # instance of music festival
      ?f wdt:P17 wd:Q142 .                # country = France
      ?f wdt:P136 ?g . ?g wdt:P279* wd:Q9778 .  # genre ⊑ electronic music
      OPTIONAL { ?f wdt:P625 ?coord . }
      OPTIONAL { ?f wdt:P856 ?site . }
      OPTIONAL { ?f wdt:P276 ?place . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
    }`;
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent":
        "BPMap/1.0 (annuaire festivals électro; marin.conan@yahoo.com)",
    },
  });
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`);
  const json = await res.json();
  return json.results.bindings.map((b) => {
    let lat = null;
    let lng = null;
    const m = b.coord?.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
    if (m) {
      lng = Number(m[1]);
      lat = Number(m[2]);
    }
    return {
      name: b.fLabel.value,
      city: b.placeLabel?.value ?? null,
      region: null,
      officialUrl: b.site?.value ?? null,
      lat,
      lng,
      genreVerified: true, // the SPARQL query already filtered on electronic genre
      sources: [b.f.value],
    };
  });
}

const raw = [
  ...(await fetchDatatourisme()),
  ...(await fetchOpenAgenda()),
  ...(await fetchWikidata()),
  ...(await fetchResidentAdvisor()),
];

const seen = new Set();
const candidates = [];
for (const c of raw) {
  const slug = slugify(c.name);
  if (known.has(slug) || seen.has(slug)) continue; // dedup vs base + within batch
  // Sources that already verified the electronic genre skip the keyword gate.
  const text = `${c.name} ${c.description ?? ""}`;
  if (!c.genreVerified && !ELECTRO_HINTS.test(text)) continue;
  seen.add(slug);
  candidates.push({ slug, ...c, status: "announced", needsReview: true });
}

writeFileSync(
  path.join(dataDir, "festivals.candidates.json"),
  JSON.stringify(candidates, null, 2) + "\n",
);
console.log(
  `✓ ${candidates.length} candidats écrits dans festivals.candidates.json (à valider à la main).`,
);
