import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FestivalGridCard from "@/components/FestivalGridCard";
import {
  getGenresWithCounts,
  getFestivalsByGenre,
  genreLabel,
  type Festival,
} from "@bpmap/shared";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return getGenresWithCounts().map((g) => ({ slug: g.slug }));
}

function isKnownGenre(slug: string): boolean {
  return getGenresWithCounts().some((g) => g.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isKnownGenre(slug)) return { title: "Genre introuvable" };

  const label = genreLabel(slug);
  const title = `Festivals ${label} en France 2026 — BPMap`;
  const description = `Tous les festivals, open airs et soirées ${label} à venir en France : dates, lieux, tarifs et billetterie. L'annuaire ${label} de BPMap.`;
  const url = `/genres/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      title: `${title}`,
      description,
      url,
    },
  };
}

function itemListJsonLd(label: string, festivals: Festival[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Festivals ${label} en France`,
    numberOfItems: festivals.length,
    itemListElement: festivals.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/festivals/${f.slug}`,
      name: f.name,
    })),
  };
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isKnownGenre(slug)) notFound();

  const label = genreLabel(slug);
  const festivals = getFestivalsByGenre(slug);
  const now = new Date();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd(label, festivals)),
        }}
      />

      <nav aria-label="Fil d'Ariane" className="mb-6 text-sm">
        <Link
          href="/genres"
          className="inline-flex items-center gap-1 text-fuchsia-700 transition-colors hover:text-fuchsia-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:text-fuchsia-400"
        >
          ← Tous les genres
        </Link>
      </nav>

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Festivals {label} en France
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {festivals.length} festival{festivals.length > 1 ? "s" : ""}, open air
          {festivals.length > 1 ? "s" : ""} et soirée{festivals.length > 1 ? "s" : ""}{" "}
          {label} à venir en France. Dates, lieux, tarifs et billetterie — classés
          par date.
        </p>
      </div>

      {festivals.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Aucun événement {label} à venir pour le moment.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {festivals.map((f) => (
            <li key={f.id}>
              <FestivalGridCard festival={f} now={now} highlightGenre={slug} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
