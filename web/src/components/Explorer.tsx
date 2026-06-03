"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  EMPTY_FILTERS,
  applyFilters,
  type Filters,
  type Festival,
} from "@bpmap/shared";
import FiltersPanel from "@/components/Filters";
import FestivalCard from "@/components/FestivalCard";

// MapLibre touches `window`, so load the map client-side only.
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800">
      Chargement de la carte…
    </div>
  ),
});

export default function Explorer({ festivals }: { festivals: Festival[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // `now` is null during SSR and the first client render (so the prerendered
  // HTML and hydration match), then set on mount — at which point past
  // festivals get hidden unless "Inclure les festivals passés" is checked.
  const [now, setNow] = useState<Date | null>(null);
  // Mount detection for hydration-safe time filtering; intentionally sets state
  // once after the first paint.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(new Date()), []);

  // Defer mounting the (heavy) WebGL map until the page is interactive, so
  // MapLibre's init doesn't inflate Total Blocking Time / Time To Interactive.
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const handle = w.requestIdleCallback
      ? w.requestIdleCallback(() => setMapReady(true), { timeout: 2000 })
      : window.setTimeout(() => setMapReady(true), 300);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, []);

  const filtered = useMemo(
    () => applyFilters(festivals, filters, now),
    [festivals, filters, now],
  );

  // The summary list under the map is sorted alphabetically by name.
  const listFestivals = useMemo(
    () => [...filtered].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [filtered],
  );

  // Drop the selection if it no longer passes the active filters.
  const visibleSelectedId =
    selectedId && filtered.some((f) => f.id === selectedId) ? selectedId : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
        <FiltersPanel filters={filters} onChange={setFilters} />
      </aside>

      <section aria-label="Résultats" className="min-w-0">
        <div className="h-[55vh] min-h-80 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          {mapReady ? (
            <Map
              festivals={filtered}
              selectedId={visibleSelectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800">
              Chargement de la carte…
            </div>
          )}
        </div>

        <p
          className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300"
          aria-live="polite"
        >
          {filtered.length} festival{filtered.length > 1 ? "s" : ""}
          {filtered.length !== festivals.length && ` sur ${festivals.length}`}
        </p>

        {filtered.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Aucun festival ne correspond à ces filtres. Essayez d&apos;élargir
            votre recherche.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listFestivals.map((f) => (
              <li key={f.id}>
                <FestivalCard
                  festival={f}
                  selected={f.id === visibleSelectedId}
                  onLocate={setSelectedId}
                  now={now}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
