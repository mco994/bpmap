"use client";

import { useId, useMemo, useRef, useState } from "react";
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
      <mark className="bg-transparent font-extrabold text-fuchsia-700 dark:text-fuchsia-300">
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
  const listId = useId();
  const optionId = useId();
  const [focused, setFocused] = useState(false);
  const [pendingIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(
    () =>
      festivals
        .map((festival) => ({ festival, match: bestQueryMatch(festival, value) }))
        .filter(
          (item): item is { festival: Festival; match: NonNullable<typeof item.match> } =>
            item.match !== null,
        )
        .slice(0, MAX_SUGGESTIONS),
    [festivals, value],
  );

  const open = focused && value.trim() !== "";
  const activeIndex = pendingIndex < items.length ? pendingIndex : -1;

  const choose = (index: number) => {
    const item = items[index];
    if (!item) return;
    onSelect(item.festival);
    setActiveIndex(-1);
    setFocused(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setFocused(false);
      setActiveIndex(-1);
      return;
    }
    if (!open || items.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(items.length - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(activeIndex);
    }
  };

  const activeOptionId = activeIndex >= 0 ? `${optionId}-${activeIndex}` : undefined;

  return (
    <div className="relative">
      <label className="block">
        <span className="sr-only">Rechercher un événement</span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          value={value}
          onChange={(event) => {
            setActiveIndex(-1);
            onChange(event.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm shadow-sm focus-visible:border-fuchsia-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <p className="sr-only" role="status">
        {open
          ? `${items.length} suggestion${items.length > 1 ? "s" : ""} — utilisez les flèches haut et bas puis Entrée`
          : ""}
      </p>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          onMouseDown={(event) => event.preventDefault()}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {items.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
              Aucun résultat
            </li>
          ) : (
            items.map(({ festival, match }, index) => {
              const label = FIELD_LABELS[match.field];
              const active = index === activeIndex;
              return (
                <li
                  key={festival.id}
                  id={`${optionId}-${index}`}
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`cursor-pointer px-4 py-2.5 transition-colors ${
                    active ? "bg-fuchsia-50 dark:bg-fuchsia-950" : ""
                  }`}
                >
                  <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    <Highlight
                      value={festival.name}
                      query={match.field === "name" ? value : ""}
                    />
                  </span>
                  <span className="block truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {festival.city} ·{" "}
                    {formatDateRange(festival.startDate, festival.endDate)}
                  </span>
                  {(label || match.approximate) && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {label}&nbsp;{match.approximate ? "≈" : ":"}
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        <Highlight value={match.value} query={value} />
                      </span>
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
