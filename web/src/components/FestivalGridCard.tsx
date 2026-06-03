import Link from "next/link";
import {
  formatDateRange,
  formatFromPrice,
  genreLabel,
  sizeTierForCapacity,
  effectiveStatus,
  statusLabel,
  type Festival,
} from "@bpmap/shared";

export default function FestivalGridCard({
  festival,
  now,
}: {
  festival: Festival;
  now: Date | null;
}) {
  const status = now ? effectiveStatus(festival, now) : festival.status;
  const showStatus = status === "passed" || status === "cancelled";
  const tier = sizeTierForCapacity(festival.capacity);

  return (
    <Link
      href={`/festivals/${festival.slug}`}
      className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-fuchsia-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-fuchsia-600"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
          {festival.name}
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

      <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {formatFromPrice(festival)}
      </p>
    </Link>
  );
}
