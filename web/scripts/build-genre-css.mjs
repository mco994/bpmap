import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { GENRE_PALETTES } from "@bpmap/shared";

const here = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(here, "..", "src", "app", "globals.css");
const MARKER = "/* genres — généré par npm run build:genre-css */";
const WHITE = "#ffffff";

function block() {
  const light = [];
  const dark = [];

  for (const [slug, palette] of Object.entries(GENRE_PALETTES)) {
    light.push(
      `  .genre-${slug} { background-color: ${palette.light.bg}; color: ${palette.light.fg}; }`,
      `  .genre-${slug}[data-active] { background-color: ${palette.solid}; color: ${WHITE}; }`,
    );
    dark.push(
      `    [data-tone="auto"] .genre-${slug} { background-color: ${palette.dark.bg}; color: ${palette.dark.fg}; }`,
      `    [data-tone="auto"] .genre-${slug}[data-active] { background-color: ${palette.solid}; color: ${WHITE}; }`,
    );
  }

  return [
    MARKER,
    "@layer components {",
    light.join("\n"),
    "",
    "  @media (prefers-color-scheme: dark) {",
    dark.join("\n"),
    "  }",
    "}",
    "",
  ].join("\n");
}

const current = readFileSync(cssPath, "utf8").replace(/\r\n/g, "\n");
const head = current.includes(MARKER)
  ? current.slice(0, current.indexOf(MARKER))
  : current;
const next = `${head.trimEnd()}\n\n${block()}`;

if (process.argv.includes("--check")) {
  if (next !== current) {
    console.error(
      "✖ globals.css n'est plus à jour avec GENRE_PALETTES — lancer « npm run build:genre-css ».",
    );
    process.exit(1);
  }
  console.log("✓ globals.css est à jour avec la palette des genres.");
} else {
  writeFileSync(cssPath, next);
  console.log(
    `✓ globals.css régénéré : ${Object.keys(GENRE_PALETTES).length} genres.`,
  );
}
