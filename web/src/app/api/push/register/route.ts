import pg from "pg";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const TOKEN_PATTERN = /^Expo(nent)?PushToken\[[\w+/=-]{10,80}\]$/;
const MAX_FAVORITES = 500;

function connectionString(): string | null {
  return process.env.CONNECTION_STRING ?? process.env.DATABASE_URL ?? null;
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit("api-push-register", request);
  if (limited) return limited;

  const url = connectionString();
  if (!url) {
    return Response.json(
      { error: "Enregistrement push indisponible pour le moment." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const { token, favorites, platform } = (body ?? {}) as {
    token?: unknown;
    favorites?: unknown;
    platform?: unknown;
  };

  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
    return Response.json({ error: "Token push invalide." }, { status: 400 });
  }
  if (
    !Array.isArray(favorites) ||
    favorites.length > MAX_FAVORITES ||
    favorites.some((f) => typeof f !== "string" || f.length > 100)
  ) {
    return Response.json({ error: "Liste de suivis invalide." }, { status: 400 });
  }
  const safePlatform =
    platform === "android" || platform === "ios" ? platform : null;

  const client = new pg.Client({ connectionString: url, ssl: true });
  try {
    await client.connect();
    await client.query(
      `insert into push_subscriptions (token, favorites, platform, updated_at)
       values ($1, $2::jsonb, $3, now())
       on conflict (token) do update
       set favorites = excluded.favorites, platform = excluded.platform, updated_at = now()`,
      [token, JSON.stringify(favorites), safePlatform],
    );
  } catch {
    return Response.json(
      { error: "Enregistrement push indisponible pour le moment." },
      { status: 503 },
    );
  } finally {
    await client.end().catch(() => {});
  }

  return Response.json({ ok: true });
}
