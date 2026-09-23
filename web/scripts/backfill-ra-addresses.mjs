// Rattrapage ponctuel : les evenements promus depuis Resident Advisor n'avaient que
// leur ville, donc le geocodeur les posait tous sur le centre-ville (7 a Marseille sur
// un seul point). On recupere l'adresse de la salle chez RA, on geocode precisement,
// et on ecrit adresse + coordonnees dans festivals.source.json.
// Au passage on retire les entrees que le motif anti-soiree durci rejette desormais.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(here, "..", "..", "shared", "src", "data", "festivals.source.json");

// Uniquement les motifs AJOUTES au durcissement, et uniquement sur les entrees issues
// de RA : appliquer tout le motif retroactivement supprimerait des entrees curees a la
// main de longue date (« KODZ Open Air x Acidelics », « Futurs Proches (… b2b …) »…).
const NEWLY_REJECTED = /clôture|cloture|\s@\s/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function raEvent(id) {
  const res = await fetch("https://ra.co/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Referer: "https://ra.co/events/fr/all",
    },
    body: JSON.stringify({
      query: "query($id: ID!){ event(id: $id){ id title venue { name address area { name } } } }",
      variables: { id: String(id) },
    }),
  });
  if (!res.ok) throw new Error(`RA HTTP ${res.status}`);
  const json = await res.json();
  return json.data?.event ?? null;
}

async function geocodeAddress(query) {
  const params = new URLSearchParams({ q: query, limit: "1" });
  const res = await fetch(`https://api-adresse.data.gouv.fr/search/?${params}`);
  if (!res.ok) throw new Error(`BAN HTTP ${res.status}`);
  const feat = (await res.json()).features?.[0];
  if (!feat) return null;
  const [lng, lat] = feat.geometry.coordinates;
  return { lat, lng, label: feat.properties.label, score: feat.properties.score };
}

const source = JSON.parse(readFileSync(srcPath, "utf8"));
const kept = [];
const dropped = [];
let fixed = 0;

for (const f of source) {
  const m = String(f.officialUrl ?? "").match(/ra\.co\/events\/(\d+)/);
  if (!m) {
    kept.push(f);
    continue;
  }
  if (NEWLY_REJECTED.test(f.name)) {
    dropped.push(f.name);
    continue;
  }
  try {
    const event = await raEvent(m[1]);
    const address = (event?.venue?.address ?? "").trim();
    const venueName = (event?.venue?.name ?? "").trim();
    if (!address) {
      console.warn(`· ${f.name} : aucune adresse chez RA, coordonnees de ville conservees`);
      kept.push(f);
      await sleep(400);
      continue;
    }
    const full = venueName && !address.includes(venueName) ? `${venueName}, ${address}` : address;
    const hit = await geocodeAddress(full);
    if (!hit) {
      console.warn(`· ${f.name} : adresse "${full}" non geocodee`);
      kept.push({ ...f, address: full });
      await sleep(400);
      continue;
    }
    console.log(`✓ ${f.name} → ${hit.label} (score ${hit.score.toFixed(2)})`);
    kept.push({ ...f, address: full, lat: hit.lat, lng: hit.lng });
    fixed++;
  } catch (err) {
    console.warn(`· ${f.name} : ${err.message}`);
    kept.push(f);
  }
  await sleep(400);
}

writeFileSync(srcPath, "[\n" + kept.map((e) => "  " + JSON.stringify(e)).join(",\n") + "\n]\n");
console.log(`\n${fixed} entrees repositionnees, ${dropped.length} retirees (motif durci, entrees RA uniquement) :`);
dropped.forEach((n) => console.log(`  - ${n}`));
console.log(`Total : ${kept.length} entrees.`);
