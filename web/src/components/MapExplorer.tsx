"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  EMPTY_FILTERS,
  applyFilters,
  filterFestivalsByQuery,
  isEmptyFilters,
  type Filters,
  type Festival,
} from "@bpmap/shared";
import FiltersPanel from "@/components/Filters";
import SearchBox from "@/components/SearchBox";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800">
      Chargement de la carte…
    </div>
  ),
});

export default function MapExplorer({ festivals }: { festivals: Festival[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(new Date()), []);

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
    () => filterFestivalsByQuery(applyFilters(festivals, filters, now), query),
    [festivals, filters, now, query],
  );

  const visibleSelectedId =
    selectedId && filtered.some((f) => f.id === selectedId) ? selectedId : null;

  const hasActive = !isEmptyFilters(filters) || query.trim() !== "";

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuery("");
  };

  const onSuggestionSelect = (festival: Festival) => {
    setSelectedId(festival.id);
    setFocus((prev) => ({ id: festival.id, nonce: (prev?.nonce ?? 0) + 1 }));
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
        <p
          className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300"
          aria-live="polite"
        >
          {filtered.length} événement{filtered.length > 1 ? "s" : ""}
          {filtered.length !== festivals.length && ` sur ${festivals.length}`}
        </p>
      </aside>

      <section aria-label="Carte" className="min-w-0">
        <div className="relative z-20 mb-3">
          <SearchBox
            value={query}
            onChange={setQuery}
            festivals={filtered}
            onSelect={onSuggestionSelect}
          />
        </div>
        <div className="h-[calc(100vh-13rem)] min-h-96 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          {mapReady ? (
            <Map
              festivals={filtered}
              selectedId={visibleSelectedId}
              onSelect={setSelectedId}
              query={query}
              focus={focus}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800">
              Chargement de la carte…
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
