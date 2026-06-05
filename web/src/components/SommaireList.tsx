"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  EMPTY_FILTERS,
  applyFilters,
  bestQueryMatch,
  filterFestivalsByQuery,
  formatDateRange,
  formatPrice,
  priceFrom,
  isEmptyFilters,
  effectiveStatus,
  statusLabel,
  groupFestivals,
  type Filters,
  type Festival,
  type SortMode,
} from "@bpmap/shared";
import FavoriteButton from "@/components/FavoriteButton";
import FiltersPanel from "@/components/Filters";
import FestivalGridCard from "@/components/FestivalGridCard";
import GenreChips from "@/components/GenreChips";

export default function SommaireList({ festivals }: { festivals: Festival[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [now, setNow] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(new Date()), []);

  const sections = useMemo(() => {
    const base = filterFestivalsByQuery(applyFilters(festivals, filters, now), query);
    return groupFestivals(base, sortMode);
  }, [festivals, filters, now, query, sortMode]);

  const filteredCount = useMemo(
    () => sections.reduce((total, section) => total + section.data.length, 0),
    [sections],
  );

  const hasActive = !isEmptyFilters(filters) || query.trim() !== "";

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuery("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
        <FiltersPanel
          filters={filters}
          onChange={setFilters}
          onReset={resetAll}
          resetActive={hasActive}
        />
      </aside>

      <section aria-label="Sommaire" className="min-w-0">
        <label className="block">
          <span className="sr-only">Rechercher un événement</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Festival, artiste, ville, genre, orga…"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm shadow-sm focus-visible:border-fuchsia-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            aria-live="polite"
          >
            {filteredCount} événement{filteredCount > 1 ? "s" : ""}
            {filteredCount !== festivals.length && ` sur ${festivals.length}`}
          </p>
          <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800"
            role="group"
            aria-label="Tri"
          >
            <button
              type="button"
              onClick={() => setSortMode("date")}
              aria-pressed={sortMode === "date"}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                sortMode === "date"
                  ? "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              Date
            </button>
            <button
              type="button"
              onClick={() => setSortMode("alpha")}
              aria-pressed={sortMode === "alpha"}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                sortMode === "alpha"
                  ? "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              A–Z
            </button>
          </div>
          <div
            className="flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800"
            role="group"
            aria-label="Affichage"
          >
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                view === "list"
                  ? "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              Liste
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                view === "grid"
                  ? "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              Mosaïque
            </button>
          </div>
          </div>
        </div>

        {filteredCount === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Aucun événement ne correspond à votre recherche.
          </p>
        ) : (
          <div className="mt-4 space-y-8">
            {sections.map((section) => (
              <section key={section.key} aria-label={section.title}>
                <h2 className="sticky top-0 z-10 -mx-1 mb-3 bg-white/85 px-1 py-2 text-sm font-bold uppercase tracking-wide text-fuchsia-700 backdrop-blur dark:bg-zinc-950/85 dark:text-fuchsia-300">
                  {section.title}
                  <span className="ml-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    {section.data.length}
                  </span>
                </h2>
                {view === "list" ? (
                  <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                    {section.data.map((f) => {
                      const status = now ? effectiveStatus(f, now) : f.status;
                      const showStatus =
                        status === "passed" || status === "cancelled";
                      const match = bestQueryMatch(f, query);
                      return (
                        <li key={f.id} className="relative">
                          <Link
                            href={`/festivals/${f.slug}`}
                            className="flex items-center justify-between gap-4 py-3 pl-4 pr-12 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fuchsia-500 dark:hover:bg-zinc-800"
                          >
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                                  {f.name}
                                </span>
                                {showStatus && (
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                                      status === "cancelled"
                                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                                    }`}
                                  >
                                    {statusLabel(status)}
                                  </span>
                                )}
                              </span>
                              <span className="mt-0.5 block truncate text-sm text-zinc-500 dark:text-zinc-400">
                                {f.city} ·{" "}
                                <time dateTime={f.startDate ?? undefined}>
                                  {formatDateRange(f.startDate, f.endDate)}
                                </time>
                              </span>
                              <span className="mt-1.5 block">
                                <GenreChips
                                  genres={f.genres}
                                  highlight={
                                    match?.field === "genre"
                                      ? match.genreSlug
                                      : undefined
                                  }
                                />
                              </span>
                            </span>
                            <span className="shrink-0 text-right text-sm">
                              <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">
                                dès
                              </span>
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                {formatPrice(priceFrom(f))}
                              </span>
                            </span>
                          </Link>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            <FavoriteButton festivalId={f.id} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {section.data.map((f) => {
                      const match = bestQueryMatch(f, query);
                      return (
                        <li key={f.id}>
                          <FestivalGridCard
                            festival={f}
                            now={now}
                            highlightGenre={
                              match?.field === "genre"
                                ? match.genreSlug
                                : undefined
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
