import type { Metadata } from "next";
import { getArtistsWithCounts } from "@bpmap/shared";
import ArtistSearch from "@/components/ArtistSearch";

export const metadata: Metadata = {
  title: "Artistes en festival électro",
  description:
    "Tous les artistes et DJs à l'affiche des festivals, open airs et soirées de musique électronique en France. Recherchez un artiste et suivez ses dates en festival.",
  alternates: { canonical: "/artistes" },
};

export default function ArtistesPage() {
  const artists = getArtistsWithCounts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Artistes en festival électro
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {artists.length} artistes à l&apos;affiche des événements de musique
          électronique en France. Cherchez un nom et suivez ses dates en
          festival.
        </p>
      </div>
      <ArtistSearch artists={artists} />
    </div>
  );
}
