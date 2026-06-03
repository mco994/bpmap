"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  EMPTY_FILTERS,
  applyFilters,
  formatDateRange,
  formatPrice,
  priceFrom,
  genreLabel,
  effectiveStatus,
  statusLabel,
  type Filters,
  type Festival,
} from "@bpmap/shared";
import FiltersPanel from "@/components/Filters";
import FestivalGridCard from "@/components/FestivalGridCard";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function SommaireList({ festivals }: { festivals: Festival[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [now, setNow] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(new Date()), []);

  const filtered = useMemo(() => {
    const base = applyFilters(festivals, filters, now);
    const q = normalize(query.trim());
    const matched = q
      ? base.filter(
          (f) =>
            normalize(f.name).includes(q) || normalize(f.city).includes(q),
        )
      : base;
    return [...matched].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [festivals, filters, now, query]);

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
        <FiltersPanel filters={filters} onChange={setFilters} />
      </aside>

      <section aria-label="Sommaire" className="min-w-0">
        <label className="block">
          <span className="sr-only">Rechercher un festival</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un festival ou une ville…"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm shadow-sm focus-visible:border-fuchsia-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            aria-live="polite"
          >
            {filtered.length} festival{filtered.length > 1 ? "s" : ""}
            {filtered.length !== festivals.length && ` sur ${festivals.length}`}
          </p>
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

        {filtered.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Aucun festival ne correspond à votre recherche.
          </p>
        ) : view === "list" ? (
          <ul className="mt-4 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {filtered.map((f) => {
              const status = now ? effectiveStatus(f, now) : f.status;
              const showStatus = status === "passed" || status === "cancelled";
              return (
                <li key={f.id}>
                  <Link
                    href={`/festivals/${f.slug}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fuchsia-500 dark:hover:bg-zinc-800"
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
                        {f.genres.length > 0 &&
                          ` · ${f.genres.slice(0, 3).map(genreLabel).join(", ")}`}
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
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((f) => (
              <li key={f.id}>
                <FestivalGridCard festival={f} now={now} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
