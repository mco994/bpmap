import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const festivals = JSON.parse(
  readFileSync(path.join(here, "..", "..", "shared", "src", "data", "festivals.json"), "utf8"),
);

const GENRE_LABELS = {
  techno: "Techno",
  house: "House",
  "french-touch": "French touch",
  "drum-n-bass": "Drum'n'bass",
  trance: "Trance",
  psytrance: "Psytrance",
  "hard-techno": "Hard techno",
  hardstyle: "Hardstyle / Hardcore",
  electro: "Electro",
  minimal: "Minimal",
  edm: "EDM / Big room",
  disco: "Disco",
  dub: "Dub / Bass",
  dubstep: "Dubstep",
  ambient: "Ambient / Expérimental",
};

function sizeTier(capacity) {
  if (capacity == null) return null;
  if (capacity >= 50000) return "XL";
  if (capacity >= 15000) return "L";
  if (capacity >= 5000) return "M";
  return "S";
}

const url = process.env.CONNECTION_STRING || process.env.DATABASE_URL;
if (!url) {
  console.error("✖ CONNECTION_STRING manquant dans .env.local");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

try {
  await client.query("begin");

  const slugs = [...new Set(festivals.flatMap((f) => f.genres))];
  for (const slug of slugs) {
    await client.query(
      `insert into genres (slug, label) values ($1, $2)
         on conflict (slug) do update set label = excluded.label`,
      [slug, GENRE_LABELS[slug] ?? slug],
    );
  }

  for (const f of festivals) {
    const { rows } = await client.query(
      `insert into festivals
        (slug, name, description, start_date, end_date, lat, lng, city, region,
         organizer, capacity, size_tier, price_day, price_full, currency,
         ticket_url, official_url, status, lineup)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       on conflict (slug) do update set
         name=excluded.name, description=excluded.description,
         start_date=excluded.start_date, end_date=excluded.end_date,
         lat=excluded.lat, lng=excluded.lng, city=excluded.city,
         region=excluded.region, organizer=excluded.organizer,
         capacity=excluded.capacity, size_tier=excluded.size_tier,
         price_day=excluded.price_day, price_full=excluded.price_full,
         currency=excluded.currency, ticket_url=excluded.ticket_url,
         official_url=excluded.official_url, status=excluded.status,
         lineup=excluded.lineup
       returning id`,
      [
        f.slug, f.name, f.description, f.startDate, f.endDate, f.lat, f.lng,
        f.city, f.region, f.organizer, f.capacity, sizeTier(f.capacity),
        f.priceDay, f.priceFull, f.currency, f.ticketUrl, f.officialUrl, f.status,
        f.lineup ?? null,
      ],
    );
    const id = rows[0].id;

    await client.query(`delete from festival_genres where festival_id = $1`, [id]);
    for (const g of f.genres) {
      await client.query(
        `insert into festival_genres (festival_id, genre_slug) values ($1, $2)
           on conflict do nothing`,
        [id, g],
      );
    }

    await client.query(
      `insert into festival_sources (festival_id, source, source_id, last_seen, raw)
         values ($1, 'research', $2, now(), $3)
         on conflict (source, source_id)
         do update set festival_id = excluded.festival_id,
                       last_seen = now(), raw = excluded.raw`,
      [id, f.slug, JSON.stringify({ sources: f.sources ?? [] })],
    );
  }

  await client.query("commit");
  console.log(`✓ ${festivals.length} festivals chargés dans Neon.`);
} catch (err) {
  await client.query("rollback");
  console.error("✖ Échec du chargement:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
