import type { NextRequest } from "next/server";
import { getChanges, getChangesSince } from "@bpmap/shared";
import { enforceRateLimit } from "@/lib/rate-limit";

const SINCE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit("api-changes", request);
  if (limited) return limited;

  const since = request.nextUrl.searchParams.get("since");

  if (since !== null && !SINCE_PATTERN.test(since)) {
    return Response.json(
      { error: "Le paramètre « since » doit être une date au format AAAA-MM-JJ." },
      { status: 400 },
    );
  }

  const changes = since ? getChangesSince(since) : getChanges();

  return Response.json(
    { changes },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
