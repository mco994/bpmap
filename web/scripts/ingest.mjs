import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import AdmZip from "adm-zip";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "..", "shared", "src", "data");
const source = JSON.parse(
  readFileSync(path.join(dataDir, "festivals.source.json"), "utf8"),
);
const known = new Set(source.map((f) => f.slug));

const ELECTRO_HINTS =
  /\b(électro|electro|techno|house|trance|psytrance|hardstyle|hardcore|hardtek|drum.?n.?bass|dnb|dub|dubstep|disco|french touch|rave|EDM|minimal)\b/i;

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


async function fetchDatatourisme() {
  const fluxUrl = process.env.DATATOURISME_FLUX_URL;
  if (!fluxUrl || fluxUrl.includes("{app_key}")) {
    console.log("· DATAtourisme: ignoré (DATATOURISME_FLUX_URL non défini ou {app_key} non remplacé)");
    return [];
  }

  const arr = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);
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
    const byName = new Map(zip.getEntries().map((e) => [e.entryName, e]));
    const byBase = new Map(
      zip.getEntries().map((e) => [e.entryName.split("/").pop(), e]),
    );
    const resolveEntry = (file) =>
      byName.get(file) ??
      byName.get(`objects/${file}`) ??
      byBase.get(file.split("/").pop()) ??
      null;

    const idx = zip.getEntry("index.json");
    const files = idx
      ? JSON.parse(idx.getData().toString("utf8")).map((it) => it.file ?? it)
      : [...byName.keys()].filter(
          (n) => n.endsWith(".json") && !/index\.json|context\.json/.test(n),
        );

    const out = [];
    for (const file of files) {
      try {
        const entry = resolveEntry(file);
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
        if (endDate && endDate < today) continue;
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
      } catch {}
    }
    console.log(`· DATAtourisme: ${out.length} événements à venir récupérés`);
    return out;
  } catch (err) {
    console.warn("· DATAtourisme: échec —", err.message);
    return [];
  }
}

async function raGraphql(body) {
  const res = await fetch("https://ra.co/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Referer: "https://ra.co/events/fr/all",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`RA HTTP ${res.status}`);
  return res.json();
}

async function raResolveAreas() {
  try {
    const json = await raGraphql({
      query: 'query{country(urlCode:"fr"){areas{id name}}}',
    });
    const areas = (json.data?.country ?? []).flatMap((c) => c.areas ?? []);
    const ids = areas
      .map((a) => Number(a.id))
      .filter((id) => Number.isFinite(id));
    return ids.length ? ids : [44];
  } catch {
    return [44];
  }
}

async function fetchResidentAdvisor() {
  const areas = await raResolveAreas();
  const today = new Date();
  const gte = today.toISOString().slice(0, 10);
  const end = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
  const lte = end.toISOString().slice(0, 10);
  const query =
    "query GET_EVENT_LISTINGS($filters: FilterInputDtoInput,$pageSize:Int,$page:Int){eventListings(filters:$filters,pageSize:$pageSize,page:$page){data{event{id title date contentUrl venue{name} artists{name}}}}}";
  const pageSize = 50;
  const maxPages = 4;
  const out = [];
  const seen = new Set();
  for (const area of areas) {
    for (let page = 1; page <= maxPages; page++) {
      let listings;
      try {
        const json = await raGraphql({
          operationName: "GET_EVENT_LISTINGS",
          variables: { filters: { areas: { eq: area }, listingDate: { gte, lte } }, pageSize, page },
          query,
        });
        listings = json.data?.eventListings?.data ?? [];
      } catch {
        break;
      }
      for (const it of listings) {
        const e = it.event;
        if (!e?.id || seen.has(e.id)) continue;
        seen.add(e.id);
        const artists = (e.artists ?? []).map((a) => a.name);
        const isFestival = /festival/i.test(e.title) || artists.length >= 6;
        const isOpenAir = /open.?air|plein air|\brave\b|rooftop|guinguette/i.test(e.title);
        if (!isFestival && !isOpenAir) continue;
        const url = e.contentUrl ? `https://ra.co${e.contentUrl}` : null;
        out.push({
          name: e.title,
          city: null,
          region: null,
          startDate: e.date ? e.date.slice(0, 10) : null,
          endDate: null,
          officialUrl: url,
          lineup: artists,
          genreVerified: true,
          sources: [url ?? "https://ra.co"],
        });
      }
      if (listings.length < pageSize) break;
      await sleep(350);
    }
    await sleep(350);
  }
  return out;
}

async function fetchOpenAgenda() {
  const base =
    "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records";
  const wheres = [
    '("festival") and ("techno" or "électro" or "house" or "trance" or "drum and bass" or "hardstyle" or "psytrance") and location_countrycode="FR" and firstdate_begin >= now()',
    '("open air" or "openair" or "plein air" or "rave") and ("techno" or "électro" or "electro" or "house" or "trance" or "drum and bass" or "hardstyle" or "psytrance" or "dj set") and location_countrycode="FR" and firstdate_begin >= now()',
  ];
  const results = [];
  const pageSize = 100;
  const maxOffset = 400;
  for (const where of wheres) {
    for (let offset = 0; offset <= maxOffset; offset += pageSize) {
      const params = new URLSearchParams({
        where,
        limit: String(pageSize),
        offset: String(offset),
        order_by: "firstdate_begin",
        select:
          "title_fr,description_fr,location_city,location_region,location_coordinates,firstdate_begin,lastdate_end,canonicalurl",
      });
      const res = await fetch(`${base}?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`OpenAgenda HTTP ${res.status}`);
      const json = await res.json();
      const batch = json.results ?? [];
      results.push(...batch);
      if (batch.length < pageSize) break;
      await sleep(300);
    }
  }
  const strip = (s) =>
    (s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
  const day = (s) => (s ?? "").slice(0, 10);

  return results
    .filter((r) => r.title_fr && r.firstdate_begin)
    .filter(
      (r) =>
        day(r.lastdate_end) > day(r.firstdate_begin) ||
        /open.?air|plein air|\brave\b/i.test(`${r.title_fr} ${r.description_fr ?? ""}`),
    )
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
      genreVerified: false,
    }));
}

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
      genreVerified: true,
      sources: [b.f.value],
    };
  });
}

const DICE_CITY_REGIONS = {
  Paris: "Île-de-France",
  Lyon: "Auvergne-Rhône-Alpes",
  Marseille: "Provence-Alpes-Côte d'Azur",
  Bordeaux: "Nouvelle-Aquitaine",
  Nantes: "Pays de la Loire",
  Lille: "Hauts-de-France",
  Toulouse: "Occitanie",
  Montpellier: "Occitanie",
  Strasbourg: "Grand Est",
  Rennes: "Bretagne",
  Nice: "Provence-Alpes-Côte d'Azur",
};

const DICE_ELECTRO_GENRES =
  /\b(acid|afrohouse|bass|dance|deephouse|disco|downtempo|electro|electrodisco|electronic|eurodance|hard_techno|house|italodisco|melodictechno|minimal|progressivehouse|psychedelica|synthpop|tech-house|techno|trance|ukg|garage)\b/i;

const DICE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseNextData(html) {
  const m = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

async function diceResolveCities() {
  try {
    const res = await fetch("https://api.dice.fm/cities", {
      headers: { Accept: "application/json", "User-Agent": DICE_UA },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const all = await res.json();
    const fr = all.filter((c) => c.country_code === "FR");
    return fr
      .filter((c) => c.id && c.perm_name && c.name)
      .map((c) => ({ name: c.name, id: c.id, perm: c.perm_name }));
  } catch (err) {
    console.warn("· DICE: résolution des villes échouée —", err.message);
    return [];
  }
}

function diceEventType(ev) {
  const text = `${ev.name ?? ""} ${ev.about?.description ?? ""}`;
  if (/open.?air|plein air|rooftop|guinguette|beach|plage/i.test(text)) {
    return "open-air";
  }
  if (/festival/i.test(text) || (ev.dates?.is_multi_days_event ?? false)) {
    return "festival";
  }
  return "soiree";
}

function diceIsElectro(ev) {
  const tagValues = (ev.tags_types ?? []).map((t) => t.value ?? "").join(" ");
  const eventTag = ev.event_tag ?? "";
  const text = `${ev.name ?? ""} ${ev.about?.description ?? ""}`;
  return (
    DICE_ELECTRO_GENRES.test(tagValues) ||
    DICE_ELECTRO_GENRES.test(eventTag) ||
    ELECTRO_HINTS.test(text) ||
    DICE_ELECTRO_GENRES.test(text)
  );
}

function diceMapEvent(ev, cityName) {
  const venue = (ev.venues ?? [])[0] ?? {};
  const loc = venue.location ?? {};
  const start = (ev.dates?.event_start_date ?? "").slice(0, 10) || null;
  const end = (ev.dates?.event_end_date ?? "").slice(0, 10) || null;
  const lineup = (ev.summary_lineup?.top_artists ?? [])
    .map((a) => a.name)
    .filter(Boolean);
  const url = ev.perm_name
    ? `https://dice.fm/event/${ev.perm_name}`
    : null;
  const description = (ev.about?.description ?? "")
    .replace(/\*+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
  return {
    name: ev.name,
    city: venue.city?.name ?? cityName,
    region: DICE_CITY_REGIONS[cityName] ?? null,
    description,
    startDate: start,
    endDate: end,
    lat: typeof loc.lat === "number" ? loc.lat : null,
    lng: typeof loc.lng === "number" ? loc.lng : null,
    officialUrl: url,
    lineup,
    source: "dice",
    eventType: diceEventType(ev),
    genreVerified: diceIsElectro(ev),
    sources: [url].filter(Boolean),
  };
}

async function diceFetchCategory(city, category, maxPages) {
  const slug = `${city.perm}-${city.id}`;
  const url = `https://dice.fm/browse/${slug}/music/${category}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": DICE_UA,
      Accept: "text/html",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) return [];
  const data = parseNextData(await res.text());
  if (!data) return [];
  const buildId = data.buildId;
  let pp = data.props?.pageProps;
  const events = [];
  let page = 0;
  while (pp && page < maxPages) {
    for (const ev of pp.events ?? []) events.push(ev);
    page += 1;
    if (!pp.nextCursor || page >= maxPages) break;
    await sleep(700);
    const dataUrl =
      `https://dice.fm/_next/data/${buildId}/en/browse/${slug}/music/${category}.json` +
      `?cursor=${encodeURIComponent(pp.nextCursor)}` +
      `&slug=${encodeURIComponent(slug)}&slug=music&slug=${category}`;
    const r2 = await fetch(dataUrl, {
      headers: {
        "User-Agent": DICE_UA,
        Accept: "application/json",
        "x-nextjs-data": "1",
      },
    });
    if (!r2.ok) break;
    try {
      pp = (await r2.json()).pageProps;
    } catch {
      break;
    }
  }
  return events;
}

async function fetchDice() {
  const cities = await diceResolveCities();
  if (!cities.length) {
    console.log("· DICE: aucune ville résolue — ignoré");
    return [];
  }
  const categories = ["dj", "party"];
  const maxPages = 3;
  const today = new Date().toISOString().slice(0, 10);
  const byId = new Map();
  for (const city of cities) {
    for (const category of categories) {
      try {
        const events = await diceFetchCategory(city, category, maxPages);
        for (const ev of events) {
          if (!ev?.name || !ev.id) continue;
          if (byId.has(ev.id)) continue;
          if (!diceIsElectro(ev)) continue;
          const start = (ev.dates?.event_start_date ?? "").slice(0, 10);
          const end =
            (ev.dates?.event_end_date ?? "").slice(0, 10) || start;
          if (end && end < today) continue;
          byId.set(ev.id, diceMapEvent(ev, city.name));
        }
      } catch {}
      await sleep(800);
    }
  }
  const out = [...byId.values()];
  console.log(
    `· DICE: ${out.length} événements électro à venir récupérés (${cities.length} villes)`,
  );
  return out;
}

const raw = [
  ...(await fetchDatatourisme()),
  ...(await fetchOpenAgenda()),
  ...(await fetchWikidata()),
  ...(await fetchResidentAdvisor()),
  ...(await fetchDice()),
];

const seen = new Set();
const candidates = [];
for (const c of raw) {
  const slug = slugify(c.name);
  if (known.has(slug) || seen.has(slug)) continue;
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
