import type { Festival, FestivalStatus } from "./types";
import { formatDateRange, statusLabel } from "./festivals";
import generated from "./data/changes.json";

export type ChangeType =
  | "added"
  | "removed"
  | "dates"
  | "price"
  | "lineup"
  | "status";

export interface Change {
  id: string;
  festivalId: string;
  festivalSlug: string;
  festivalName: string;
  type: ChangeType;
  date: string;
  summary: string;
}

export const CHANGES = generated as unknown as Change[];

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  added: "Nouvel événement",
  removed: "Événement retiré",
  dates: "Dates modifiées",
  price: "Tarifs modifiés",
  lineup: "Line-up mis à jour",
  status: "Statut modifié",
};

export function changeTypeLabel(type: ChangeType): string {
  return CHANGE_TYPE_LABELS[type];
}

export function getChanges(): Change[] {
  return [...CHANGES].sort((a, b) => b.date.localeCompare(a.date));
}

export function getChangesSince(since: string): Change[] {
  return getChanges().filter((c) => c.date > since);
}

function priceSignature(f: Festival): string {
  const tariffs = (f.tariffs ?? [])
    .map((t) => `${t.label}:${t.price ?? "-"}`)
    .sort()
    .join("|");
  return `${f.priceDay ?? "-"}/${f.priceFull ?? "-"}/${tariffs}`;
}

function lineupSignature(f: Festival): string {
  return [...(f.lineup ?? [])].sort().join("|");
}

function changeId(festivalId: string, type: ChangeType, date: string): string {
  return `${date}:${festivalId}:${type}`;
}

function statusSummary(prev: FestivalStatus, next: FestivalStatus): string {
  return `Statut : ${statusLabel(prev)} → ${statusLabel(next)}.`;
}

export function diffFestivals(
  previous: Festival[],
  next: Festival[],
  date: string,
): Change[] {
  const prevById = new Map(previous.map((f) => [f.id, f]));
  const nextById = new Map(next.map((f) => [f.id, f]));
  const changes: Change[] = [];

  const push = (
    f: Festival,
    type: ChangeType,
    summary: string,
  ): void => {
    changes.push({
      id: changeId(f.id, type, date),
      festivalId: f.id,
      festivalSlug: f.slug,
      festivalName: f.name,
      type,
      date,
      summary,
    });
  };

  for (const f of next) {
    if (!prevById.has(f.id)) {
      push(
        f,
        "added",
        `Ajouté à ${f.city} — ${formatDateRange(f.startDate, f.endDate)}.`,
      );
    }
  }

  for (const f of previous) {
    if (!nextById.has(f.id)) {
      changes.push({
        id: changeId(f.id, "removed", date),
        festivalId: f.id,
        festivalSlug: f.slug,
        festivalName: f.name,
        type: "removed",
        date,
        summary: "Retiré de la liste.",
      });
    }
  }

  for (const f of next) {
    const prev = prevById.get(f.id);
    if (!prev) continue;

    if (prev.startDate !== f.startDate || prev.endDate !== f.endDate) {
      push(
        f,
        "dates",
        `Nouvelles dates : ${formatDateRange(f.startDate, f.endDate)}.`,
      );
    }

    if (priceSignature(prev) !== priceSignature(f)) {
      push(f, "price", "Les tarifs ont été mis à jour.");
    }

    if (lineupSignature(prev) !== lineupSignature(f)) {
      push(f, "lineup", "Le line-up a été mis à jour.");
    }

    if (prev.status !== f.status) {
      push(f, "status", statusSummary(prev.status, f.status));
    }
  }

  return changes;
}
