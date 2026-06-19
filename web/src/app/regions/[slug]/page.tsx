import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FestivalGridCard from "@/components/FestivalGridCard";
import {
  getRegionsWithCounts,
  getRegionBySlug,
  getFestivalsByRegion,
  type Festival,
} from "@bpmap/shared";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return getRegionsWithCounts().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) return { title: "Région introuvable" };

  const title = `Festivals & open airs en ${region} — BPMap`;
  const description = `Tous les festivals, open airs et soirées de musique électronique à venir en ${region} : dates, lieux, tarifs et billetterie sur BPMap.`;
  const url = `/regions/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      title,
      description,
      url,
    },
  };
}

function itemListJsonLd(region: string, festivals: Festival[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Festivals & open airs en ${region}`,
    numberOfItems: festivals.length,
    itemListElement: festivals.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/festivals/${f.slug}`,
      name: f.name,
    })),
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) notFound();

  const festivals = getFestivalsByRegion(slug);
  const now = new Date();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd(region, festivals)),
        }}
      />

      <nav aria-label="Fil d'Ariane" className="mb-6 text-sm">
        <Link
          href="/regions"
          className="inline-flex items-center gap-1 text-fuchsia-700 transition-colors hover:text-fuchsia-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:text-fuchsia-400"
        >
          ← Toutes les régions
        </Link>
      </nav>

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Festivals &amp; open airs en {region}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {festivals.length} festival{festivals.length > 1 ? "s" : ""}, open air
          {festivals.length > 1 ? "s" : ""} et soirée{festivals.length > 1 ? "s" : ""}{" "}
          de musique électronique à venir en {region}. Dates, lieux, tarifs et
          billetterie — classés par date.
        </p>
      </div>

      {festivals.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Aucun événement à venir en {region} pour le moment.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {festivals.map((f) => (
            <li key={f.id}>
              <FestivalGridCard festival={f} now={now} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
