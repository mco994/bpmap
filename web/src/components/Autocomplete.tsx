"use client";

import { useId, useRef, useState } from "react";

interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** Max suggestions shown. */
  limit?: number;
}

// Accessible combobox (WAI-ARIA): a search input with a live, keyboard-navigable
// suggestion list. Substring, case/accent-insensitive matching.
export default function Autocomplete({
  label,
  value,
  onChange,
  options,
  placeholder,
  limit = 8,
}: AutocompleteProps) {
  const inputId = useId();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");

  const q = norm(value.trim());
  const suggestions = (
    q ? options.filter((o) => norm(o).includes(q)) : options
  ).slice(0, limit);

  function select(option: string) {
    onChange(option);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && active >= 0 && suggestions[active]) {
      e.preventDefault();
      select(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className="relative">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 ? `${listId}-opt-${active}` : undefined
          }
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 pr-7 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {value && (
          <button
            type="button"
            aria-label="Effacer"
            onClick={() => {
              onChange("");
              setActive(-1);
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {suggestions.map((option, i) => (
            <li
              key={option}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              // Keep input focus so the click registers before blur closes the list.
              onMouseDown={(e) => {
                e.preventDefault();
                if (blurTimer.current) clearTimeout(blurTimer.current);
                select(option);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                i === active
                  ? "bg-fuchsia-600 text-white"
                  : "text-zinc-700 dark:text-zinc-200"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
