"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllFestivals, type Festival } from "@bpmap/shared";
import FestivalGridCard from "@/components/FestivalGridCard";
import { useFavorites } from "@/lib/favorites";

function byStartDate(a: Festival, b: Festival): number {
  if (a.startDate === null && b.startDate === null)
    return a.name.localeCompare(b.name, "fr");
  if (a.startDate === null) return 1;
  if (b.startDate === null) return -1;
  return a.startDate.localeCompare(b.startDate);
}

export default function SuivisList() {
  const favorites = useFavorites();
  const [now, setNow] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(new Date()), []);

  const followed = useMemo(
    () =>
      getAllFestivals()
        .filter((f) => favorites.has(f.id))
        .sort(byStartDate),
    [favorites],
  );

  if (followed.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
        <p className="text-3xl" aria-hidden>
          ♡
        </p>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Aucun événement suivi pour l&apos;instant.
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          Cliquez sur le cœur d&apos;un événement (carte, liste ou fiche) pour le
          retrouver ici. Les suivis sont stockés sur cet appareil.
        </p>
        <Link
          href="/festivals"
          className="mt-4 inline-block rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-fuchsia-700"
        >
          Parcourir les événements
        </Link>
      </div>
    );
  }

  return (
    <>
      <p
        className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
        aria-live="polite"
      >
        {followed.length} événement{followed.length > 1 ? "s" : ""} suivi
        {followed.length > 1 ? "s" : ""}
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {followed.map((f) => (
          <li key={f.id}>
            <FestivalGridCard festival={f} now={now} />
          </li>
        ))}
      </ul>
    </>
  );
}
