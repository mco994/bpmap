import type { Metadata } from "next";
import Link from "next/link";
import { getGenresWithCounts } from "@bpmap/shared";

export const metadata: Metadata = {
  title: "Festivals électro par genre en France",
  description:
    "Explorez les festivals et open airs de musique électronique en France par genre : techno, house, drum'n'bass, trance, hardstyle et plus encore.",
  alternates: { canonical: "/genres" },
};

export default function GenresHubPage() {
  const genres = getGenresWithCounts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Fil d'Ariane" className="mb-6 text-sm">
        <Link
          href="/festivals"
          className="inline-flex items-center gap-1 text-fuchsia-700 transition-colors hover:text-fuchsia-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:text-fuchsia-400"
        >
          ← Tous les festivals
        </Link>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Festivals électro par genre
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Choisissez un genre pour découvrir les festivals, open airs et soirées de
        musique électronique à venir en France.
      </p>

      {genres.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Aucun événement à venir pour le moment.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {genres.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/genres/${g.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-fuchsia-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-fuchsia-600"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {g.label}
                </span>
                <span className="shrink-0 rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-xs font-medium text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200">
                  {g.count} événement{g.count > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
