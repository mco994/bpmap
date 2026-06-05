import { getAllFestivals } from "@bpmap/shared";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforceRateLimit("api-festivals", request);
  if (limited) return limited;

  return Response.json(
    { festivals: getAllFestivals() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
