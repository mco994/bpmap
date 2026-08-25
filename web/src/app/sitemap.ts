import type { MetadataRoute } from "next";
import {
  effectiveStatus,
  getAllFestivals,
  getArtistsWithCounts,
  getGenresWithCounts,
  getRegionsWithCounts,
} from "@bpmap/shared";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const festivals = getAllFestivals().map((festival) => ({
    url: absoluteUrl(`/festivals/${festival.slug}`),
    changeFrequency: "weekly" as const,
    priority: effectiveStatus(festival, now) === "passed" ? 0.2 : 0.8,
  }));

  const genres = getGenresWithCounts(now).map((genre) => ({
    url: absoluteUrl(`/genres/${genre.slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const regions = getRegionsWithCounts(now).map((region) => ({
    url: absoluteUrl(`/regions/${region.slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const artists = getArtistsWithCounts().map((artist) => ({
    url: absoluteUrl(`/artistes/${artist.slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/festivals"), changeFrequency: "daily", priority: 0.9 },
    {
      url: absoluteUrl("/nouveautes"),
      changeFrequency: "daily" as const,
      priority: 0.5,
    },
    ...["genres", "regions", "artistes"].map((path) => ({
      url: absoluteUrl(`/${path}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...["mentions-legales", "confidentialite", "sources"].map((path) => ({
      url: absoluteUrl(`/${path}`),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    ...genres,
    ...regions,
    ...artists,
    ...festivals,
  ];
}
