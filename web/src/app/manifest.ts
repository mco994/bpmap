import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BPMap — événements de musique électronique en France",
    short_name: "BPMap",
    description:
      "L'annuaire et la carte interactive des festivals, open airs et soirées de musique électronique en France.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#c026d3",
    lang: "fr",
    categories: ["music", "entertainment", "events"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
