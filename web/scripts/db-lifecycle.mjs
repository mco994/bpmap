// Daily lifecycle maintenance on Neon:
//   - marks announced/confirmed festivals whose end date has passed as "passed"
//   - purges every festival (incl. cancelled) that ended more than 1 month ago
// Cancelled festivals are kept (status "cancelled") until that same 1-month
// cutoff. Reads CONNECTION_STRING from the environment.
//
//   npm run db:lifecycle
//
import pg from "pg";

const url = process.env.CONNECTION_STRING || process.env.DATABASE_URL;
if (!url) {
  console.error("✖ CONNECTION_STRING manquant");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
try {
  const passed = await client.query(
    `update festivals set status = 'passed'
       where end_date is not null
         and end_date < current_date
         and status in ('announced', 'confirmed')`,
  );
  const purged = await client.query(
    `delete from festivals
       where end_date is not null
         and end_date < current_date - interval '1 month'`,
  );
  console.log(
    `✓ Lifecycle: ${passed.rowCount} marqués "passed", ${purged.rowCount} purgés (>1 mois).`,
  );
} catch (err) {
  console.error("✖ Lifecycle a échoué:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
