"use client";

import { useId, useState } from "react";
import { type Filters, type PriceBounds } from "@bpmap/shared";
import FiltersPanel from "@/components/Filters";
import Icon from "@/components/Icon";

export default function FiltersAside({
  filters,
  onChange,
  bounds,
  onReset,
  resetActive,
  activeCount,
  children,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  bounds: PriceBounds;
  onReset: () => void;
  resetActive: boolean;
  activeCount: number;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 lg:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700"
      >
        <span className="inline-flex items-center gap-2">
          <Icon name="sliders" />
          Filtres
          {activeCount > 0 && (
            <span className="rounded-full bg-fuchsia-600 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
              {activeCount}
            </span>
          )}
        </span>
        <Icon name={open ? "x" : "chevron-down"} />
      </button>
      <div id={panelId} className={`${open ? "mt-4 block" : "hidden"} lg:mt-0 lg:block`}>
        <FiltersPanel
          filters={filters}
          onChange={onChange}
          bounds={bounds}
          onReset={onReset}
          resetActive={resetActive}
        />
        {children}
      </div>
    </aside>
  );
}
