import { getAllFestivals } from "@bpmap/shared";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    { festivals: getAllFestivals() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
