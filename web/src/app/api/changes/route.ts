import type { NextRequest } from "next/server";
import { getChanges, getChangesSince } from "@bpmap/shared";

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get("since");
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
