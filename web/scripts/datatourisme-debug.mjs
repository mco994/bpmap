import AdmZip from "adm-zip";

const url = process.env.DATATOURISME_FLUX_URL;
if (!url || url.includes("{app_key}")) {
  console.error(
    "✖ DATATOURISME_FLUX_URL manquant (ou {app_key} pas remplacé) dans .env.local",
  );
  process.exit(1);
}

const res = await fetch(url);
console.log("HTTP:", res.status, "| content-type:", res.headers.get("content-type"));
const buf = Buffer.from(await res.arrayBuffer());
console.log("taille:", buf.length, "octets");

const isZip = buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b;
if (!res.ok || !isZip) {
  console.log("\n--- Corps de la réponse (pas un ZIP) ---");
  console.log(buf.toString("utf8").slice(0, 1000));
  process.exit(0);
}

const zip = new AdmZip(buf);
const entries = zip.getEntries();
console.log("entrées ZIP:", entries.length);
console.log("exemples de noms:", entries.slice(0, 6).map((e) => e.entryName));

const idx = zip.getEntry("index.json");
console.log("index.json présent:", !!idx);

let firstFile;
if (idx) {
  const list = JSON.parse(idx.getData().toString("utf8"));
  console.log("index.json: nb d'entrées =", list.length);
  console.log("index[0] =", JSON.stringify(list[0]));
  firstFile = list[0]?.file ?? list[0];
} else {
  firstFile = entries
    .map((e) => e.entryName)
    .find((n) => n.endsWith(".json") && !/index/.test(n));
}

if (firstFile) {
  const poi = JSON.parse(zip.getEntry(firstFile).getData().toString("utf8"));
  console.log("\n--- 1er POI (JSON-LD, extrait) ---");
  console.log(JSON.stringify(poi, null, 1).slice(0, 3000));
} else {
  console.log("Aucun fichier POI trouvé.");
}
