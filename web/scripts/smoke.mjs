import puppeteer from "puppeteer";

const BASE = process.env.SMOKE_BASE ?? "http://127.0.0.1:3111";
const ROUTES = process.argv.slice(2);
const routes = ROUTES.length > 0 ? ROUTES : ["/", "/festivals", "/artistes"];

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let failures = 0;

for (const route of routes) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const problems = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    const failure = request.failure();
    problems.push(`request: ${request.url()} — ${failure?.errorText ?? "?"}`);
  });

  const response = await page.goto(`${BASE}${route}`, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });

  await new Promise((resolve) => setTimeout(resolve, 4000));

  const canvas = await page.$("canvas");
  const headers = response?.headers() ?? {};

  console.log(`\n=== ${route} — HTTP ${response?.status()}`);
  console.log(`csp: ${headers["content-security-policy"] ? "présent" : "ABSENT"}`);
  console.log(`nosniff: ${headers["x-content-type-options"] ?? "ABSENT"}`);
  if (route === "/") console.log(`canvas carte: ${canvas ? "présent" : "ABSENT"}`);

  const relevant = problems.filter(
    (problem) => !problem.includes("favicon") && !problem.includes("_next/image"),
  );
  if (relevant.length > 0) {
    failures += relevant.length;
    console.log(`problèmes (${relevant.length}) :`);
    for (const problem of relevant.slice(0, 12)) console.log(`  - ${problem}`);
  } else {
    console.log("aucun problème console/réseau");
  }

  await page.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "✓ smoke OK" : `✖ ${failures} problème(s)`}`);
process.exit(failures === 0 ? 0 : 1);
