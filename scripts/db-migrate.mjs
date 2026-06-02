// Applies every supabase/migrations/*.sql file (in order) to the database in
// DATABASE_URL. Re-runnable: the SQL uses IF NOT EXISTS / guarded enum creation.
//
//   npm run db:migrate            (reads DATABASE_URL from .env.local)
//
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "..", "supabase", "migrations");

const url = process.env.CONNECTION_STRING || process.env.DATABASE_URL;
if (!url) {
  console.error(
    "✖ CONNECTION_STRING manquant. Ajoute ta connection string Neon dans .env.local :\n" +
      "  CONNECTION_STRING=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    process.stdout.write(`▶ ${file} … `);
    await client.query(sql);
    console.log("ok");
  }
  console.log("✓ Migrations appliquées sur Neon.");
} catch (err) {
  console.error("\n✖ Échec de migration:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
