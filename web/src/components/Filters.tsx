"use client";

import { useId } from "react";
import {
  isEmptyFilters,
  EMPTY_FILTERS,
  GENRES,
  SIZE_TIERS,
  EVENT_TYPES,
  getPriceBounds,
  type Filters,
  type SizeTier,
  type EventType,
} from "@bpmap/shared";

interface FiltersPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset?: () => void;
  resetActive?: boolean;
}

const { maxDay, maxFull } = getPriceBounds();

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
        active
          ? "border-fuchsia-600 bg-fuchsia-600 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

export default function FiltersPanel({
  filters,
  onChange,
  onReset,
  resetActive,
}: FiltersPanelProps) {
  const ids = {
    from: useId(),
    to: useId(),
    day: useId(),
    full: useId(),
  };

  const toggleGenre = (slug: string) =>
    onChange({
      ...filters,
      genres: filters.genres.includes(slug)
        ? filters.genres.filter((g) => g !== slug)
        : [...filters.genres, slug],
    });

  const toggleSize = (tier: SizeTier) =>
    onChange({
      ...filters,
      sizes: filters.sizes.includes(tier)
        ? filters.sizes.filter((s) => s !== tier)
        : [...filters.sizes, tier],
    });

  const toggleEventType = (type: EventType) =>
    onChange({
      ...filters,
      eventTypes: filters.eventTypes.includes(type)
        ? filters.eventTypes.filter((t) => t !== type)
        : [...filters.eventTypes, type],
    });

  const dayValue = filters.priceDayMax ?? maxDay;
  const fullValue = filters.priceFullMax ?? maxFull;

  return (
    <form
      className="space-y-5"
      aria-label="Filtres"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtres</h2>
        <button
          type="button"
          onClick={onReset ?? (() => onChange(EMPTY_FILTERS))}
          disabled={!(resetActive ?? !isEmptyFilters(filters))}
          className="text-sm font-medium text-fuchsia-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:text-fuchsia-400"
        >
          Retirer tous les filtres
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={filters.includePast}
          onChange={(e) =>
            onChange({ ...filters, includePast: e.target.checked })
          }
          className="h-4 w-4 accent-fuchsia-600"
        />
        Inclure les festivals passés
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Type
        </legend>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <Chip
              key={t.type}
              active={filters.eventTypes.includes(t.type)}
              onClick={() => toggleEventType(t.type)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Genre
        </legend>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Chip
              key={g.slug}
              active={filters.genres.includes(g.slug)}
              onClick={() => toggleGenre(g.slug)}
            >
              {g.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Dates
        </legend>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-zinc-600 dark:text-zinc-400">Du</span>
            <input
              id={ids.from}
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) =>
                onChange({ ...filters, dateFrom: e.target.value || null })
              }
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-zinc-600 dark:text-zinc-400">Au</span>
            <input
              id={ids.to}
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) =>
                onChange({ ...filters, dateTo: e.target.value || null })
              }
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Taille
        </legend>
        <div className="flex flex-wrap gap-2">
          {SIZE_TIERS.map((s) => (
            <Chip
              key={s.tier}
              active={filters.sizes.includes(s.tier)}
              onClick={() => toggleSize(s.tier)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor={ids.day}
          className="mb-1 flex items-center justify-between text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          <span>Prix / jour</span>
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            {filters.priceDayMax === null ? "Tous" : `≤ ${dayValue} €`}
          </span>
        </label>
        <input
          id={ids.day}
          type="range"
          min={0}
          max={maxDay}
          step={5}
          value={dayValue}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange({ ...filters, priceDayMax: v >= maxDay ? null : v });
          }}
          className="w-full accent-fuchsia-600"
        />
      </div>

      <div>
        <label
          htmlFor={ids.full}
          className="mb-1 flex items-center justify-between text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          <span>Prix / pass complet</span>
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            {filters.priceFullMax === null ? "Tous" : `≤ ${fullValue} €`}
          </span>
        </label>
        <input
          id={ids.full}
          type="range"
          min={0}
          max={maxFull}
          step={5}
          value={fullValue}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange({ ...filters, priceFullMax: v >= maxFull ? null : v });
          }}
          className="w-full accent-fuchsia-600"
        />
      </div>
    </form>
  );
}
