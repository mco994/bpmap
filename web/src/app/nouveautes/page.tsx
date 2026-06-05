import type { Metadata } from "next";
import Link from "next/link";
import { changeTypeLabel, getChanges, type Change } from "@bpmap/shared";

export const metadata: Metadata = {
  title: "Nouveautés",
  description:
    "Le journal des changements de BPMap : nouveaux événements, dates, tarifs, line-ups et statuts mis à jour.",
  alternates: { canonical: "/nouveautes" },
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}

function groupByDate(changes: Change[]): [string, Change[]][] {
  const groups = new Map<string, Change[]>();
  for (const c of changes) {
    const list = groups.get(c.date) ?? [];
    list.push(c);
    groups.set(c.date, list);
  }
  return [...groups.entries()];
}

export default function NouveautesPage() {
  const groups = groupByDate(getChanges());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Nouveautés</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Le journal des changements de la base : ajouts, dates, tarifs, line-ups
        et statuts. Mis à jour automatiquement chaque jour.
      </p>

      {groups.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">
            Aucun changement pour l&apos;instant.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {groups.map(([date, items]) => (
            <section key={date}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {formatDate(date)}
              </h2>
              <ul className="mt-3 space-y-3">
                {items.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-xs font-medium text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200">
                        {changeTypeLabel(c.type)}
                      </span>
                      {c.type === "removed" ? (
                        <span className="font-semibold">{c.festivalName}</span>
                      ) : (
                        <Link
                          href={`/festivals/${c.festivalSlug}`}
                          className="font-semibold text-fuchsia-700 hover:underline dark:text-fuchsia-300"
                        >
                          {c.festivalName}
                        </Link>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                      {c.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
