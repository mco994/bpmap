import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { diffFestivals } from "@bpmap/shared";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "..", "shared", "src", "data");
const festivalsPath = path.join(dataDir, "festivals.json");
const changesPath = path.join(dataDir, "changes.json");
const MAX_CHANGES = 500;

function readJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadPrevious() {
  const fromEnv = process.env.PREV_FESTIVALS_PATH;
  if (fromEnv && existsSync(fromEnv)) {
    return readJson(readFileSync(fromEnv, "utf8"), null);
  }
  try {
    const out = execFileSync(
      "git",
      ["show", "HEAD:shared/src/data/festivals.json"],
      { cwd: path.join(here, "..", ".."), encoding: "utf8" },
    );
    return readJson(out, null);
  } catch {
    return null;
  }
}

const next = readJson(readFileSync(festivalsPath, "utf8"), []);
const previous = loadPrevious();

if (previous === null) {
  console.log("· diff-changes: aucune version précédente, journal inchangé.");
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const fresh = diffFestivals(previous, next, today);

if (fresh.length === 0) {
  console.log("· diff-changes: aucun changement significatif.");
  process.exit(0);
}

const existing = readJson(
  existsSync(changesPath) ? readFileSync(changesPath, "utf8") : "[]",
  [],
);
const seen = new Set(existing.map((c) => c.id));
const merged = [...fresh.filter((c) => !seen.has(c.id)), ...existing].slice(
  0,
  MAX_CHANGES,
);

writeFileSync(changesPath, JSON.stringify(merged, null, 2) + "\n");
console.log(
  `✓ diff-changes: ${fresh.length} changement(s) journalisé(s) (${merged.length} au total).`,
);
