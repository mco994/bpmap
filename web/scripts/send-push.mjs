import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const changesPath = path.join(here, "..", "..", "shared", "src", "data", "changes.json");

const url = process.env.CONNECTION_STRING || process.env.DATABASE_URL;
if (!url) {
  console.log("· Push: CONNECTION_STRING absent, étape ignorée.");
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const changes = JSON.parse(readFileSync(changesPath, "utf8")).filter(
  (c) => c.date === today,
);
if (changes.length === 0) {
  console.log("· Push: aucun changement aujourd'hui, rien à envoyer.");
  process.exit(0);
}

const MAX_PER_DEVICE = 4;
const BATCH_SIZE = 100;

function messagesFor(subscription) {
  const favorites = new Set(subscription.favorites ?? []);
  const relevant = changes.filter(
    (c) => c.type === "added" || favorites.has(c.festivalId),
  );
  if (relevant.length === 0) return [];
  if (relevant.length > MAX_PER_DEVICE) {
    return [
      {
        to: subscription.token,
        title: "BPMap",
        body: `${relevant.length} nouveautés sur les événements électro.`,
        data: { slug: null },
      },
    ];
  }
  return relevant.map((c) => ({
    to: subscription.token,
    title: c.type === "added" ? `Nouvel événement : ${c.festivalName}` : c.festivalName,
    body: c.summary,
    data: { slug: c.festivalSlug },
  }));
}

const client = new pg.Client({ connectionString: url, ssl: true });
await client.connect();

let subscriptions;
try {
  const res = await client.query(
    "select token, favorites from push_subscriptions",
  );
  subscriptions = res.rows;
} catch (err) {
  console.log(`· Push: lecture des abonnements impossible (${err.message}), étape ignorée.`);
  await client.end();
  process.exit(0);
}

const messages = subscriptions.flatMap(messagesFor);
console.log(
  `· Push: ${changes.length} changements du jour, ${subscriptions.length} appareils, ${messages.length} notifications à envoyer.`,
);

const deadTokens = new Set();
for (let i = 0; i < messages.length; i += BATCH_SIZE) {
  const batch = messages.slice(i, i + BATCH_SIZE);
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    const json = await res.json();
    const tickets = Array.isArray(json.data) ? json.data : [];
    tickets.forEach((ticket, idx) => {
      if (ticket.details?.error === "DeviceNotRegistered") {
        deadTokens.add(batch[idx].to);
      }
    });
  } catch (err) {
    console.warn(`· Push: lot ${i / BATCH_SIZE + 1} en échec — ${err.message}`);
  }
}

if (deadTokens.size > 0) {
  await client.query("delete from push_subscriptions where token = any($1)", [
    [...deadTokens],
  ]);
  console.log(`· Push: ${deadTokens.size} tokens morts supprimés.`);
}

await client.end();
console.log("✓ Push: envoi terminé.");
