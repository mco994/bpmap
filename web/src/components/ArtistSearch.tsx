"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

interface ArtistItem {
  name: string;
  slug: string;
  count: number;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export default function ArtistSearch({ artists }: { artists: ArtistItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return artists;
    return artists.filter((artist) => normalize(artist.name).includes(needle));
  }, [artists, query]);

  return (
    <div>
      <label htmlFor="artist-search" className="sr-only">
        Rechercher un artiste
      </label>
      <input
        id="artist-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un artiste…"
        autoComplete="off"
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm transition-colors focus-visible:border-fuchsia-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />

      <p
        className="mt-3 text-sm text-zinc-600 dark:text-zinc-400"
        aria-live="polite"
      >
        {filtered.length} artiste{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Aucun artiste ne correspond à « {query} ».
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((artist) => (
            <li key={artist.slug}>
              <Link
                href={`/artistes/${artist.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-fuchsia-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-fuchsia-600"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {artist.name}
                </span>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {artist.count} festival{artist.count > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
