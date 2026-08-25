import pg from "pg";

const globalForPool = globalThis as typeof globalThis & {
  bpmapPool?: pg.Pool;
};

export function connectionString(): string | null {
  return process.env.CONNECTION_STRING ?? process.env.DATABASE_URL ?? null;
}

export function getPool(): pg.Pool | null {
  const url = connectionString();
  if (!url) return null;

  if (!globalForPool.bpmapPool) {
    globalForPool.bpmapPool = new pg.Pool({
      connectionString: url,
      ssl: true,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    globalForPool.bpmapPool.on("error", () => {});
  }

  return globalForPool.bpmapPool;
}
