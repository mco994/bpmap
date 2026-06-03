// Quick sanity check: lists the public tables and their row counts.
//   npm run db:check
import pg from "pg";

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
  const { rows: tables } = await client.query(
    `select table_name from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE'
       order by table_name`,
  );
  for (const { table_name } of tables) {
    const { rows } = await client.query(
      `select count(*)::int as n from "${table_name}"`,
    );
    console.log(`• ${table_name}: ${rows[0].n} lignes`);
  }
  const { rows: ext } = await client.query(
    `select extname from pg_extension where extname in ('postgis','pgcrypto') order by extname`,
  );
  console.log("extensions:", ext.map((e) => e.extname).join(", ") || "—");
} finally {
  await client.end();
}
