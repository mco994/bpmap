import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const dataDir = path.join(import.meta.dirname, "..", "..", "shared", "src", "data");
const sourcePath = path.join(dataDir, "festivals.source.json");
const datesPath = path.join(dataDir, "dates.json");
const pricesPath = path.join(dataDir, "prices.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

const NON_OFFICIAL_HOSTS =
  /(shotgun\.live|dice\.fm|ra\.co|residentadvisor|billetweb|billetterie|weezevent|yurplan|eventbrite|linktr\.ee|fanlink\.tv|instagram\.com|soundcloud\.com|spotify\.com|bandsintown|songkick|stayhappening|happeningnext)/i;
const FB_LINK = /https?:\/\/(?:www\.|m\.|web\.|fr-fr\.|fr\.)?facebook\.com\/[^\s"'<>)]+/gi;
const EXCLUDED_OFFER = /navette|shuttle|after|groupe|group|camping|parking|consigne|vestiaire/i;
const STOPWORDS = new Set([
  "festival", "fest", "open", "air", "openair", "night", "nuit", "soiree", "edition",
  "gratuit", "free", "le", "la", "les", "du", "de", "des", "the", "et", "and",
  "by", "x", "vol", "officiel", "official", "toulouse",
]);

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const DRY = flag("dry");
const ONLY_SLUG = opt("slug");
const LIMIT = Number(opt("limit")) || Infinity;
const CURRENT_YEAR = new Date().getFullYear();

const normalize = (s) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const significantTokens = (s) =>
  normalize(s)
    .split(" ")
    .filter((t) => t.length > 1 && !/^\d+$/.test(t) && !STOPWORDS.has(t));

function nameScore(festivalName, candidateName) {
  const want = significantTokens(festivalName);
  if (!want.length) return 0;
  const have = new Set(significantTokens(candidateName));
  return want.filter((t) => have.has(t)).length / want.length;
}

function cityMatch(festival, locationText) {
  const hay = normalize(locationText);
  if (!hay) return false;
  const cityTokens = significantTokens(festival.city);
  if (cityTokens.length && cityTokens.every((t) => hay.includes(t))) return true;
  if (cityTokens[0] && hay.includes(cityTokens[0])) return true;
  return false;
}

const yearOf = (d) => {
  const m = String(d ?? "").match(/(\d{4})/);
  return m ? Number(m[1]) : null;
};

function normalizeFbUrl(u) {
  try {
    const url = new URL(u);
    url.hash = "";
    url.search = "";
    url.host = "www.facebook.com";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

const isEventUrl = (u) => /facebook\.com\/events\/\d+/i.test(u);

function discoverCandidates(festival) {
  const fields = [festival.officialUrl, festival.ticketUrl, ...(festival.sources ?? [])]
    .filter((u) => typeof u === "string");
  const found = new Map();
  const add = (url, viaOfficial) => {
    const n = normalizeFbUrl(url);
    if (!n) return;
    if (!found.has(n) || viaOfficial) found.set(n, { url: n, viaOfficial });
  };
  for (const u of fields) {
    if (/facebook\.com/i.test(u)) add(u, true);
  }
  return { declared: [...found.values()], listingPages: fields.filter((u) => /^https?:/i.test(u) && !/facebook\.com/i.test(u)) };
}

async function fbLinksFromPage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "fr-FR,fr;q=0.9" },
      redirect: "follow",
    });
    if (!res.ok) return [];
    const html = await res.text();
    const viaOfficial = !NON_OFFICIAL_HOSTS.test(url);
    return [...new Set(html.match(FB_LINK) ?? [])]
      .map((u) => normalizeFbUrl(u))
      .filter((u) => u && !/facebook\.com\/(tr|sharer|plugins|dialog|login|help|policies)\b/i.test(u))
      .map((u) => ({ url: u, viaOfficial }));
  } catch {
    return [];
  }
}

function eventsFromJsonLd(blocks) {
  const out = [];
  for (const raw of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const items = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
    for (const item of items) {
      const types = Array.isArray(item?.["@type"]) ? item["@type"] : [item?.["@type"]];
      if (!types.some((t) => String(t).includes("Event"))) continue;
      const loc = item.location ?? {};
      const addr = loc.address ?? {};
      const locationText = [
        loc.name,
        typeof addr === "string" ? addr : [addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(" ");
      const offers = Array.isArray(item.offers) ? item.offers : item.offers ? [item.offers] : [];
      out.push({
        name: item.name ?? "",
        startDate: item.startDate ?? null,
        endDate: item.endDate ?? null,
        locationText,
        offers,
      });
    }
  }
  return out;
}

function lowestPrice(offers) {
  const usable = offers
    .map((o) => ({ price: Number(o.price ?? o.lowPrice), name: o.name ?? "" }))
    .filter((o) => Number.isFinite(o.price) && o.price > 0 && !EXCLUDED_OFFER.test(o.name));
  return usable.length ? Math.min(...usable.map((o) => o.price)) : null;
}

function evaluate(festival, ev, viaOfficial) {
  const expectedYear = yearOf(festival.startDate);
  const evYear = yearOf(ev.startDate);
  const yearOk = expectedYear
    ? evYear === expectedYear
    : evYear !== null && evYear >= CURRENT_YEAR && evYear <= CURRENT_YEAR + 1;
  const score = nameScore(festival.name, ev.name);
  const cityOk = cityMatch(festival, `${ev.locationText} ${ev.name}`);
  const accept = yearOk && cityOk && (score >= 0.5 || viaOfficial);
  const reasons = [];
  if (!yearOk) reasons.push(`année ${evYear ?? "∅"} ≠ attendu ${expectedYear ?? `≥${CURRENT_YEAR}`}`);
  if (!cityOk) reasons.push(`ville « ${festival.city} » absente du lieu FB`);
  if (yearOk && cityOk && score < 0.5 && !viaOfficial) reasons.push(`nom trop faible (${score.toFixed(2)}) et pas de lien officiel`);
  return { accept, score, viaOfficial, evYear, reasons };
}

async function harvest(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
  await page.evaluate(() => {
    const close = [...document.querySelectorAll('[aria-label="Fermer"],[aria-label="Close"]')][0];
    close?.click();
  }).catch(() => {});
  const blocks = await page.evaluate(() =>
    [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
  );
  return eventsFromJsonLd(blocks);
}

async function harvestCrawler(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": CRAWLER_UA, Accept: "text/html" }, redirect: "follow" });
    if (!res.ok) return [];
    const html = await res.text();
    const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    return eventsFromJsonLd(blocks);
  } catch {
    return [];
  }
}

const source = JSON.parse(readFileSync(sourcePath, "utf8"));
const dates = JSON.parse(readFileSync(datesPath, "utf8"));
const prices = JSON.parse(readFileSync(pricesPath, "utf8"));

const targets = source
  .filter((f) => (ONLY_SLUG ? f.slug === ONLY_SLUG : true))
  .filter((f) => ONLY_SLUG || !f.startDate || prices[f.slug]?.priceFull == null)
  .slice(0, LIMIT);

console.log(`Facebook: ${targets.length} festivals à enrichir${DRY ? " (dry-run)" : ""}`);
if (!targets.length) process.exit(0);

let browser;
let dateUpdates = 0;
let priceUpdates = 0;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(UA);

  for (const festival of targets) {
    const { declared, listingPages } = discoverCandidates(festival);
    const fromListings = (await Promise.all(listingPages.map(fbLinksFromPage))).flat();
    const candidates = [...declared, ...fromListings];
    const byUrl = new Map();
    for (const c of candidates) {
      if (!byUrl.has(c.url) || c.viaOfficial) byUrl.set(c.url, c);
    }
    const eventCandidates = [...byUrl.values()].filter((c) => isEventUrl(c.url));
    if (!eventCandidates.length) {
      console.log(`· ${festival.slug}: aucune page d'événement FB officielle trouvée`);
      continue;
    }

    let best = null;
    for (const cand of eventCandidates) {
      let events = await harvestCrawler(cand.url);
      if (!events.length) {
        try {
          events = await harvest(page, cand.url);
        } catch (err) {
          console.warn(`· ${festival.slug}: ${cand.url} — échec (${err.message})`);
          continue;
        }
      }
      if (!events.length) {
        console.warn(`· ${festival.slug}: ${cand.url} — pas de données structurées (mur de connexion FB probable)`);
        continue;
      }
      for (const ev of events) {
        const verdict = evaluate(festival, ev, cand.viaOfficial);
        if (verdict.accept && (!best || verdict.score > best.verdict.score)) {
          best = { ev, verdict, url: cand.url };
        } else if (!verdict.accept) {
          console.log(`· ${festival.slug}: rejeté « ${ev.name} » — ${verdict.reasons.join(" ; ")}`);
        }
      }
    }

    if (!best) continue;
    const start = (best.ev.startDate ?? "").slice(0, 10) || null;
    const end = (best.ev.endDate ?? "").slice(0, 10) || start;
    console.log(`· ${festival.slug}: ✓ « ${best.ev.name} » (${best.url}) score=${best.verdict.score.toFixed(2)} → ${start}…${end}`);

    if (!festival.startDate && start && dates[festival.slug]?.startDate !== start) {
      dates[festival.slug] = { startDate: start, endDate: end };
      dateUpdates++;
    }
    const price = lowestPrice(best.ev.offers);
    if (price != null && festival.priceDay !== 0 && prices[festival.slug]?.priceFull == null) {
      prices[festival.slug] = { ...(prices[festival.slug] ?? {}), priceFull: price };
      priceUpdates++;
    }
  }
} catch (err) {
  console.warn(`Facebook: navigateur indisponible, étape ignorée — ${err.message}`);
  process.exit(0);
} finally {
  await browser?.close();
}

if (!DRY && dateUpdates) writeFileSync(datesPath, JSON.stringify(dates, null, 2) + "\n");
if (!DRY && priceUpdates) writeFileSync(pricesPath, JSON.stringify(prices, null, 2) + "\n");
console.log(`Facebook: ${dateUpdates} dates, ${priceUpdates} prix${DRY ? " (non écrits, dry-run)" : ""}`);
