import { readFileSync } from "node:fs";
import { validateDataset } from "@bpmap/shared";

const [previousPath, currentPath] = process.argv.slice(2);
if (!currentPath) {
  console.error("✖ Usage: npx tsx web/scripts/check-data.mjs [precedent.json] <courant.json>");
  process.exit(2);
}

function read(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`✖ ${path} illisible : ${err.message}`);
    process.exit(1);
  }
}

const current = read(currentPath);
const previous = previousPath ? read(previousPath) : undefined;
const { errors, warnings } = validateDataset(current, previous);

for (const warning of warnings) console.log(`· ${warning}`);

if (errors.length > 0) {
  console.error(`✖ ${errors.length} anomalie(s) dans ${currentPath} :`);
  for (const error of errors.slice(0, 40)) console.error(`  - ${error}`);
  if (errors.length > 40) console.error(`  … et ${errors.length - 40} autre(s).`);
  process.exit(1);
}

console.log(`✓ Données valides : ${current.length} événements contrôlés.`);
