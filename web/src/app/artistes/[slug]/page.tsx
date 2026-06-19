import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArtistsWithCounts,
  getArtistBySlug,
  getFestivalsByArtist,
} from "@bpmap/shared";
import FestivalGridCard from "@/components/FestivalGridCard";
import FollowArtistButton from "@/components/FollowArtistButton";

export function generateStaticParams() {
  return getArtistsWithCounts().map((artist) => ({ slug: artist.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return { title: "Artiste introuvable" };

  return {
    title: `${artist.name} en festival`,
    description: `Tous les festivals, open airs et soirées électro où ${artist.name} est à l'affiche en France. Suivez ses dates sur BPMap.`,
    alternates: { canonical: `/artistes/${artist.slug}` },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      title: `${artist.name} en festival · BPMap`,
      description: `Tous les festivals électro où ${artist.name} est à l'affiche en France.`,
      url: `/artistes/${artist.slug}`,
    },
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  const festivals = getFestivalsByArtist(artist.slug);
  const now = new Date();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${artist.name} en festival`,
    numberOfItems: festivals.length,
    itemListElement: festivals.map((festival, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/festivals/${festival.slug}`,
      name: festival.name,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Fil d'Ariane" className="mb-6 text-sm">
        <Link
          href="/artistes"
          className="inline-flex items-center gap-1 text-fuchsia-700 transition-colors hover:text-fuchsia-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
        >
          ← Tous les artistes
        </Link>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {artist.name}
        </h1>
        <FollowArtistButton slug={artist.slug} withLabel />
      </div>

      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        {festivals.length > 0
          ? `À l'affiche de ${festivals.length} événement${
              festivals.length > 1 ? "s" : ""
            } de musique électronique en France.`
          : "Aucun événement à l'affiche pour le moment."}
      </p>

      {festivals.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {festivals.map((festival) => (
            <li key={festival.id}>
              <FestivalGridCard festival={festival} now={now} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
