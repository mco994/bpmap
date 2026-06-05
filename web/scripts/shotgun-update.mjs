import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const dataDir = path.join(import.meta.dirname, "..", "..", "shared", "src", "data");
const sourcePath = path.join(dataDir, "festivals.source.json");
const pricesPath = path.join(dataDir, "prices.json");
const lineupsPath = path.join(dataDir, "lineups.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const EXCLUDED_OFFER = /navette|shuttle|after|groupe|group|yog|camping|parking|consigne|vestiaire/i;
const DAY_OFFER = /lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|monday|tuesday|wednesday|thursday|friday|saturday|sunday|1\s?jour|jour\s?[123]|day\s?[123]|1\s?day/i;

function shotgunTargets() {
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  return source.flatMap((festival) => {
    const url = [festival.ticketUrl, festival.officialUrl].find(
      (u) => u && u.includes("shotgun.live"),
    );
    return url
      ? [
          {
            slug: festival.slug,
            url,
            startDate: festival.startDate,
            endDate: festival.endDate,
            free: festival.priceDay === 0,
          },
        ]
      : [];
  });
}

function eventFromJsonLd(blocks) {
  for (const raw of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
      const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
      if (types.some((t) => String(t).includes("Event"))) return item;
    }
  }
  return null;
}

function floors(offers, target) {
  const usable = offers.filter(
    (o) =>
      typeof o.price === "number" &&
      o.price > 0 &&
      !String(o.availability ?? "").includes("SoldOut") &&
      !EXCLUDED_OFFER.test(o.name ?? ""),
  );
  const min = (arr) => (arr.length ? Math.min(...arr.map((o) => o.price)) : null);
  const diffDays =
    target.endDate && target.startDate
      ? Math.round((Date.parse(target.endDate) - Date.parse(target.startDate)) / 86400000)
      : 0;
  const dayOffers = usable.filter((o) => DAY_OFFER.test(o.name ?? ""));
  const multiDay = diffDays >= 2 || (diffDays >= 1 && dayOffers.length > 0);
  if (!multiDay) return { day: min(usable), full: null };
  const passOffers = usable.filter((o) => !DAY_OFFER.test(o.name ?? ""));
  return { day: min(dayOffers), full: min(passOffers) };
}

function sameEdition(baseStart, harvestedStart) {
  if (!baseStart || !harvestedStart) return false;
  return baseStart.slice(0, 4) === String(harvestedStart).slice(0, 4);
}

async function harvest(page, target) {
  await page.goto(target.url, { waitUntil: "networkidle2", timeout: 45000 });
  const blocks = await page.evaluate(() =>
    [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (s) => s.textContent,
    ),
  );
  const event = eventFromJsonLd(blocks);
  if (!event) return { skip: "pas de JSON-LD événement" };
  if (!sameEdition(target.startDate, event.startDate)) {
    return { skip: `édition différente (page: ${String(event.startDate).slice(0, 10)}, base: ${target.startDate})` };
  }
  const offers = Array.isArray(event.offers) ? event.offers : event.offers ? [event.offers] : [];
  const performers = (Array.isArray(event.performer) ? event.performer : event.performer ? [event.performer] : [])
    .map((p) => p?.name)
    .filter(Boolean);
  return { floors: floors(offers, target), performers };
}

const targets = shotgunTargets();
console.log(`Shotgun: ${targets.length} pages à relever`);
if (targets.length === 0) process.exit(0);

const prices = JSON.parse(readFileSync(pricesPath, "utf8"));
const lineups = JSON.parse(readFileSync(lineupsPath, "utf8"));
let priceUpdates = 0;
let lineupUpdates = 0;

let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(UA);

  for (const target of targets) {
    let result;
    try {
      result = await harvest(page, target);
    } catch (err) {
      console.warn(`· ${target.slug}: échec — ${err.message}`);
      continue;
    }
    if (result.skip) {
      console.warn(`· ${target.slug}: ignoré — ${result.skip}`);
      continue;
    }
    if (!target.free) {
      const current = prices[target.slug] ?? {};
      const next = {
        priceDay: result.floors.day ?? current.priceDay ?? null,
        priceFull: result.floors.full ?? current.priceFull ?? null,
      };
      if (next.priceDay !== (current.priceDay ?? null) || next.priceFull !== (current.priceFull ?? null)) {
        prices[target.slug] = next;
        priceUpdates++;
        console.log(`· ${target.slug}: prix ${current.priceDay ?? "∅"}/${current.priceFull ?? "∅"} → ${next.priceDay ?? "∅"}/${next.priceFull ?? "∅"}`);
      }
    }
    const existing = lineups[target.slug] ?? [];
    if (result.performers.length > existing.length) {
      lineups[target.slug] = result.performers;
      lineupUpdates++;
      console.log(`· ${target.slug}: line-up ${existing.length} → ${result.performers.length} artistes`);
    }
  }
} catch (err) {
  console.warn(`Shotgun: navigateur indisponible, étape ignorée — ${err.message}`);
  process.exit(0);
} finally {
  await browser?.close();
}

if (priceUpdates) writeFileSync(pricesPath, JSON.stringify(prices, null, 2) + "\n");
if (lineupUpdates) writeFileSync(lineupsPath, JSON.stringify(lineups, null, 2) + "\n");
console.log(`Shotgun: ${priceUpdates} prix mis à jour, ${lineupUpdates} line-ups enrichis`);
