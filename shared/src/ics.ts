import type { Festival } from "./types";

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toIcsDate(value: string): string {
  return value.replace(/-/g, "").slice(0, 8);
}

function addDay(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function nowStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function festivalIcs(festival: Festival, siteUrl?: string): string {
  if (!festival.startDate) return "";

  const base = (siteUrl ?? "").replace(/\/$/, "");
  const pageUrl = base ? `${base}/festivals/${festival.slug}` : "";
  const uid = `${festival.slug}@bpmap`;

  const start = toIcsDate(festival.startDate);
  const end = festival.endDate
    ? addDay(festival.endDate)
    : addDay(festival.startDate);

  const location = [festival.city, festival.region]
    .filter(Boolean)
    .join(", ");

  const descriptionParts = [festival.description];
  if (pageUrl) descriptionParts.push(pageUrl);
  const description = descriptionParts.filter(Boolean).join("\n\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BPMap//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeText(uid)}`,
    `DTSTAMP:${nowStamp()}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeText(festival.name)}`,
    `LOCATION:${escapeText(location)}`,
    `DESCRIPTION:${escapeText(description)}`,
    ...(pageUrl ? [`URL:${escapeText(pageUrl)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}
