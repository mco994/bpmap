// Reads src/data/festivals.source.json, geocodes each festival's city via the
// French BAN (Base Adresse Nationale, free, no key), and writes the final
// src/data/festivals.json consumed by the app. Entries that already carry
// lat/lng (e.g. overseas territories the BAN doesn't cover well) are kept as-is.
//
//   npm run geocode
//
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "..", "shared", "src", "data");
const source = JSON.parse(
  readFileSync(path.join(dataDir, "festivals.source.json"), "utf8"),
);
const lineups = JSON.parse(
  readFileSync(path.join(dataDir, "lineups.json"), "utf8"),
);
const descriptions = JSON.parse(
  readFileSync(path.join(dataDir, "descriptions.json"), "utf8"),
);
const prices = JSON.parse(readFileSync(path.join(dataDir, "prices.json"), "utf8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Purge cutoff: festivals that ended more than 1 month ago are dropped from the
// generated data (they stay in festivals.source.json as an archive). Dateless
// ("à confirmer") festivals are always kept.
const today = new Date();
const purgeCutoff = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  .toISOString()
  .slice(0, 10);

async function geocode(city, postcode) {
  const params = new URLSearchParams({ q: city, type: "municipality", limit: "1" });
  if (postcode) params.set("postcode", postcode);
  const res = await fetch(`https://api-adresse.data.gouv.fr/search/?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const feat = json.features?.[0];
  if (!feat) return null;
  const [lng, lat] = feat.geometry.coordinates;
  return { lat, lng, label: feat.properties.label };
}

// A source URL that is actually a ticketing platform → usable as ticketUrl.
const TICKET_HOST =
  /(shotgun\.live|dice\.fm|billetweb|helloasso|seetickets|weezevent|yurplan|festicket|billetreduc)/i;

const out = [];
const failures = [];
const purged = [];

for (const f of source) {
  if (f.endDate && f.endDate < purgeCutoff) {
    purged.push(f.name); // finished > 1 month ago
    continue;
  }
  let { lat, lng } = f;
  if (lat == null || lng == null) {
    try {
      const hit = await geocode(f.city, f.postcode);
      if (hit) {
        ({ lat, lng } = hit);
        console.log(`✓ ${f.name} → ${f.city} (${hit.label})`);
      } else {
        failures.push(f.name);
        console.warn(`✖ ${f.name} → ville introuvable: ${f.city}`);
        continue;
      }
    } catch (err) {
      failures.push(f.name);
      console.warn(`✖ ${f.name} → ${err.message}`);
      continue;
    }
    await sleep(120); // be polite with the public API
  } else {
    console.log(`• ${f.name} → coords fournies`);
  }

  out.push({
    id: f.slug,
    slug: f.slug,
    name: f.name,
    description: descriptions[f.slug] ?? f.description ?? "",
    startDate: f.startDate,
    endDate: f.endDate,
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    city: f.city,
    region: f.region,
    organizer: f.organizer ?? null,
    capacity: prices[f.slug]?.capacity ?? f.capacity ?? null,
    genres: f.genres ?? [],
    priceDay: prices[f.slug]?.priceDay ?? f.priceDay ?? null,
    priceFull: prices[f.slug]?.priceFull ?? f.priceFull ?? null,
    tariffs: prices[f.slug]?.tariffs ?? f.tariffs ?? undefined,
    currency: "EUR",
    ticketUrl: f.ticketUrl ?? (f.sources ?? []).find((s) => TICKET_HOST.test(s)) ?? null,
    officialUrl: f.officialUrl ?? null,
    status: f.status ?? "announced",
    ...(f.eclectic ? { eclectic: true } : {}),
    ...(lineups[f.slug] ? { lineup: lineups[f.slug] } : {}),
    sources: f.sources ?? [],
  });
}

out.sort((a, b) => (a.startDate ?? "9999").localeCompare(b.startDate ?? "9999"));
writeFileSync(
  path.join(dataDir, "festivals.json"),
  JSON.stringify(out, null, 2) + "\n",
);

console.log(`\n✓ ${out.length} festivals écrits dans festivals.json`);
if (purged.length) {
  console.log(`🗑 ${purged.length} purgés (finis depuis +1 mois): ${purged.join(", ")}`);
}
if (failures.length) {
  console.log(`⚠ ${failures.length} non géocodés (exclus): ${failures.join(", ")}`);
}
