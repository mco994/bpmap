"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sortByDateThenName, type Festival } from "@bpmap/shared";
import FestivalGridCard from "@/components/FestivalGridCard";
import { useFavorites } from "@/lib/favorites";

type LoadState = "loading" | "ready" | "error";

export default function SuivisList() {
  const favorites = useFavorites();
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/festivals", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { festivals?: Festival[] };
        setFestivals(payload.festivals ?? []);
        setNow(new Date());
        setState("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        void error;
        setState("error");
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const followed = useMemo(
    () => sortByDateThenName(festivals.filter((f) => favorites.has(f.id))),
    [festivals, favorites],
  );

  if (state === "loading") {
    return (
      <p
        className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
        role="status"
      >
        Chargement de vos suivis…
      </p>
    );
  }

  if (state === "error") {
    return (
      <p
        className="mt-8 rounded-xl border border-dashed border-red-300 p-10 text-center text-red-700 dark:border-red-800 dark:text-red-400"
        role="alert"
      >
        Impossible de charger vos suivis pour le moment. Réessayez plus tard.
      </p>
    );
  }

  if (followed.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
        <p className="text-3xl" aria-hidden>
          ♡
        </p>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Aucun événement suivi pour l&apos;instant.
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Cliquez sur le cœur d&apos;un événement (carte, liste ou fiche) pour le
          retrouver ici. Les suivis sont stockés sur cet appareil.
        </p>
        <Link
          href="/festivals"
          className="mt-4 inline-block rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
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
        {followed.map((festival) => (
          <li key={festival.id}>
            <FestivalGridCard festival={festival} now={now} />
          </li>
        ))}
      </ul>
    </>
  );
}
