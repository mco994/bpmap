"use client";

import { useState } from "react";
import Link from "next/link";
import {
  formatDateRange,
  formatPrice,
  genreLabel,
  sizeTierForCapacity,
  effectiveStatus,
  statusLabel,
  type Festival,
} from "@bpmap/shared";

interface FestivalCardProps {
  festival: Festival;
  selected: boolean;
  onLocate: (id: string) => void;
  /** Null until mounted on the client; gates the "Passé" badge. */
  now: Date | null;
}

export default function FestivalCard({
  festival,
  selected,
  onLocate,
  now,
}: FestivalCardProps) {
  const status = now ? effectiveStatus(festival, now) : festival.status;
  const showStatus = status === "passed" || status === "cancelled";
  const tier = sizeTierForCapacity(festival.capacity);
  const [expanded, setExpanded] = useState(false);
  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm transition-colors dark:bg-zinc-900 ${
        selected
          ? "border-fuchsia-500 ring-1 ring-fuchsia-500"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-tight">
          <Link
            href={`/festivals/${festival.slug}`}
            className="text-zinc-900 hover:text-fuchsia-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:text-zinc-50"
          >
            {festival.name}
          </Link>
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {showStatus && (
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                status === "cancelled"
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
            >
              {statusLabel(status)}
            </span>
          )}
          {tier && (
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {tier}
            </span>
          )}
        </div>
      </div>

      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {festival.city}, {festival.region}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <time dateTime={festival.startDate ?? undefined}>
          {formatDateRange(festival.startDate, festival.endDate)}
        </time>
      </p>

      <ul className="mt-2 flex flex-wrap gap-1" aria-label="Genres">
        {festival.genres.map((g) => (
          <li
            key={g}
            className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200"
          >
            {genreLabel(g)}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <p className="text-zinc-700 dark:text-zinc-300">
          Jour&nbsp;<strong>{formatPrice(festival.priceDay)}</strong> · Pass&nbsp;
          <strong>{formatPrice(festival.priceFull)}</strong>
        </p>
        <button
          type="button"
          onClick={() => onLocate(festival.id)}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Localiser
        </button>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={`details-${festival.id}`}
        className="mt-3 w-full rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {expanded ? "Voir moins" : "Voir plus"}
      </button>

      {expanded && (
        <div
          id={`details-${festival.id}`}
          className="mt-3 space-y-2 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-800"
        >
          {festival.description && (
            <p className="line-clamp-3 text-zinc-600 dark:text-zinc-400">
              {festival.description}
            </p>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-zinc-700 dark:text-zinc-300">
            <dt className="text-zinc-500 dark:text-zinc-400">Organisateur</dt>
            <dd>{festival.organizer ?? "—"}</dd>
            <dt className="text-zinc-500 dark:text-zinc-400">Capacité</dt>
            <dd>
              {festival.capacity
                ? `~${festival.capacity.toLocaleString("fr-FR")}`
                : "—"}
            </dd>
          </dl>
          {festival.lineup && festival.lineup.length > 0 && (
            <p className="text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-500 dark:text-zinc-400">Line-up : </span>
              {festival.lineup.slice(0, 6).join(", ")}
              {festival.lineup.length > 6 ? "…" : ""}
            </p>
          )}
          {(festival.ticketUrl || festival.officialUrl) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {festival.ticketUrl && (
                <a
                  href={festival.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-fuchsia-700 hover:underline dark:text-fuchsia-400"
                >
                  Billetterie ↗
                </a>
              )}
              {festival.officialUrl && (
                <a
                  href={festival.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-fuchsia-700 hover:underline dark:text-fuchsia-400"
                >
                  Site officiel ↗
                </a>
              )}
            </div>
          )}
          <Link
            href={`/festivals/${festival.slug}`}
            className="inline-block font-medium text-zinc-900 hover:text-fuchsia-700 hover:underline dark:text-zinc-50"
          >
            Voir la fiche complète →
          </Link>
        </div>
      )}
    </article>
  );
}
