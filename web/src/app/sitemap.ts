import type { MetadataRoute } from "next";
import { getAllFestivals } from "@bpmap/shared";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const festivals = getAllFestivals().map((f) => ({
    url: `${SITE_URL}/festivals/${f.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    ...festivals,
  ];
}
