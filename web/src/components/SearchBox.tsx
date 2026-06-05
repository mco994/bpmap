"use client";

import { useMemo, useState } from "react";
import {
  bestQueryMatch,
  formatDateRange,
  queryMatchRange,
  type Festival,
  type QueryMatchField,
} from "@bpmap/shared";

const MAX_SUGGESTIONS = 6;

const FIELD_LABELS: Record<QueryMatchField, string | null> = {
  name: null,
  city: "Ville",
  artist: "Line-up",
  genre: "Genre",
  organizer: "Organisateur",
};

function Highlight({ value, query }: { value: string; query: string }) {
  const range = queryMatchRange(value, query);
  if (!range) return <>{value}</>;
  const [start, end] = range;
  return (
    <>
      {value.slice(0, start)}
      <mark className="bg-transparent font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
        {value.slice(start, end)}
      </mark>
      {value.slice(end)}
    </>
  );
}

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  festivals: Festival[];
  onSelect: (festival: Festival) => void;
  placeholder?: string;
}

export default function SearchBox({
  value,
  onChange,
  festivals,
  onSelect,
  placeholder = "Festival, artiste, ville, genre, orga…",
}: SearchBoxProps) {
  const [focused, setFocused] = useState(false);

  const items = useMemo(
    () =>
      festivals
        .map((festival) => ({ festival, match: bestQueryMatch(festival, value) }))
        .filter((item) => item.match !== null)
        .slice(0, MAX_SUGGESTIONS),
    [festivals, value],
  );

  const open = focused && value.trim() !== "";

  return (
    <div className="relative">
      <label className="block">
        <span className="sr-only">Rechercher un événement</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm shadow-sm focus-visible:border-fuchsia-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {open && (
        <ul
          role="listbox"
          aria-label="Suggestions"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {items.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Aucun résultat
            </li>
          ) : (
            items.map(({ festival, match }) => {
              const field = match!.field;
              const label = FIELD_LABELS[field];
              return (
                <li key={festival.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSelect(festival);
                      setFocused(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800"
                  >
                    <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      <Highlight value={festival.name} query={field === "name" ? value : ""} />
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {festival.city} · {formatDateRange(festival.startDate, festival.endDate)}
                    </span>
                    {(label || match!.approximate) && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2 py-0.5 text-xs dark:bg-fuchsia-950">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {label}&nbsp;{match!.approximate ? "≈" : ":"}
                        </span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          <Highlight value={match!.value} query={value} />
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
