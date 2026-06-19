import type { MetadataRoute } from "next";
import {
  getAllFestivals,
  getGenresWithCounts,
  getRegionsWithCounts,
  getArtistsWithCounts,
} from "@bpmap/shared";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const festivals = getAllFestivals().map((f) => ({
    url: `${SITE_URL}/festivals/${f.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const genres = getGenresWithCounts().map((g) => ({
    url: `${SITE_URL}/genres/${g.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const regions = getRegionsWithCounts().map((r) => ({
    url: `${SITE_URL}/regions/${r.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const artists = getArtistsWithCounts().map((a) => ({
    url: `${SITE_URL}/artistes/${a.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/festivals`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...["genres", "regions", "artistes"].map((p) => ({
      url: `${SITE_URL}/${p}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...["mentions-legales", "confidentialite", "sources"].map((p) => ({
      url: `${SITE_URL}/${p}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    ...genres,
    ...regions,
    ...artists,
    ...festivals,
  ];
}
