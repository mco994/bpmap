import type { Festival } from "./types";

export function compareByDateThenName(a: Festival, b: Festival): number {
  const aDated = a.startDate !== null;
  const bDated = b.startDate !== null;
  if (aDated && !bDated) return -1;
  if (!aDated && bDated) return 1;
  if (aDated && bDated && a.startDate !== b.startDate) {
    return (a.startDate as string).localeCompare(b.startDate as string);
  }
  return a.name.localeCompare(b.name, "fr");
}

export function sortByDateThenName(festivals: Festival[]): Festival[] {
  return [...festivals].sort(compareByDateThenName);
}

export interface FestivalSection {
  key: string;
  title: string;
  data: Festival[];
}

const UNDATED_KEY = "undated";
const UNDATED_TITLE = "Date à confirmer";

const MONTH_FMT = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

function capitalizeFirst(value: string): string {
  if (value.length === 0) return value;
  return value[0].toLocaleUpperCase("fr-FR") + value.slice(1);
}

function monthKey(startDate: string): string {
  return startDate.slice(0, 7);
}

function monthTitle(startDate: string): string {
  const date = new Date(`${startDate}T00:00:00`);
  return capitalizeFirst(MONTH_FMT.format(date));
}

export function groupByMonth(festivals: Festival[]): FestivalSection[] {
  const sorted = sortByDateThenName(festivals);
  const sections: FestivalSection[] = [];
  const indexByKey = new Map<string, number>();
  let undated: FestivalSection | null = null;

  for (const festival of sorted) {
    if (festival.startDate === null) {
      if (!undated) {
        undated = { key: UNDATED_KEY, title: UNDATED_TITLE, data: [] };
      }
      undated.data.push(festival);
      continue;
    }
    const key = monthKey(festival.startDate);
    const existing = indexByKey.get(key);
    if (existing === undefined) {
      indexByKey.set(key, sections.length);
      sections.push({
        key,
        title: monthTitle(festival.startDate),
        data: [festival],
      });
    } else {
      sections[existing].data.push(festival);
    }
  }

  if (undated) sections.push(undated);
  return sections;
}
