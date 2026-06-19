"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  formatDateRange,
  formatPrice,
  priceFrom,
  type Festival,
} from "@bpmap/shared";

type DayEntry = {
  date: Date;
  iso: string;
  label: string;
  weekday: string;
  festivals: Festival[];
};

const MONTH_TITLE_FMT = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});
const DAY_LABEL_FMT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
});
const WEEKDAY_FMT = new Intl.DateTimeFormat("fr-FR", { weekday: "long" });

function capitalizeFirst(value: string): string {
  if (value.length === 0) return value;
  return value[0].toLocaleUpperCase("fr-FR") + value.slice(1);
}

function isoDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function coversDay(festival: Festival, iso: string): boolean {
  if (!festival.startDate) return false;
  const end = festival.endDate ?? festival.startDate;
  return festival.startDate <= iso && iso <= end;
}

function earliestStartMonth(festivals: Festival[]): Date {
  const dated = festivals
    .map((f) => f.startDate)
    .filter((d): d is string => d !== null)
    .sort();
  const base = dated.length > 0 ? parseDay(dated[0]) : new Date();
  return new Date(base.getFullYear(), base.getMonth(), 1);
}

function buildDays(festivals: Festival[], anchor: Date): DayEntry[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const entries: DayEntry[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const iso = isoDay(date);
    const dayFestivals = festivals.filter((f) => coversDay(f, iso));
    if (dayFestivals.length === 0) continue;
    entries.push({
      date,
      iso,
      label: capitalizeFirst(DAY_LABEL_FMT.format(date)),
      weekday: WEEKDAY_FMT.format(date),
      festivals: dayFestivals,
    });
  }
  return entries;
}

export default function CalendarView({
  festivals,
  onSelect,
}: {
  festivals: Festival[];
  onSelect?: (festival: Festival) => void;
}) {
  const headingId = useId();
  const [anchor, setAnchor] = useState<Date>(() =>
    earliestStartMonth(festivals),
  );

  const days = useMemo(
    () => buildDays(festivals, anchor),
    [festivals, anchor],
  );

  const monthTitle = capitalizeFirst(MONTH_TITLE_FMT.format(anchor));

  const goToMonth = (offset: number) => {
    setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          aria-label="Mois précédent"
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ‹ Précédent
        </button>
        <h2
          id={headingId}
          aria-live="polite"
          className="text-center text-sm font-bold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300"
        >
          {monthTitle}
        </h2>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Mois suivant"
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Suivant ›
        </button>
      </div>

      {days.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Aucun événement ce mois-ci.
        </p>
      ) : (
        <ol className="mt-4 space-y-6">
          {days.map((day) => (
            <li key={day.iso}>
              <h3 className="mb-2 border-b border-zinc-200 pb-1 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
                <time dateTime={day.iso}>{day.label}</time>
              </h3>
              <ul className="space-y-2">
                {day.festivals.map((f) => {
                  const price = priceFrom(f);
                  return (
                    <li key={f.id}>
                      <Link
                        href={`/festivals/${f.slug}`}
                        onClick={() => onSelect?.(f)}
                        className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-zinc-900 dark:text-zinc-50">
                            {f.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {f.city} ·{" "}
                            <time dateTime={f.startDate ?? undefined}>
                              {formatDateRange(f.startDate, f.endDate)}
                            </time>
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {formatPrice(price)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
