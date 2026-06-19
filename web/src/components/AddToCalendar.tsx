"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { festivalIcs, type Festival } from "@bpmap/shared";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function icsDate(value: string): string {
  return value.replace(/-/g, "").slice(0, 8);
}

function nextDay(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function googleCalendarUrl(festival: Festival): string | null {
  if (!festival.startDate) return null;
  const start = icsDate(festival.startDate);
  const end = festival.endDate ? nextDay(festival.endDate) : nextDay(festival.startDate);
  const pageUrl = SITE_URL ? `${SITE_URL.replace(/\/$/, "")}/festivals/${festival.slug}` : "";
  const details = [festival.description, pageUrl].filter(Boolean).join("\n\n");
  const location = [festival.city, festival.region].filter(Boolean).join(", ");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: festival.name,
    dates: `${start}/${end}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function AddToCalendar({ festival }: { festival: Festival }) {
  const [open, setOpen] = useState(false);
  const hasDate = Boolean(festival.startDate);
  const gcalUrl = googleCalendarUrl(festival);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const downloadIcs = () => {
    const content = festivalIcs(festival, SITE_URL || undefined);
    if (!content) return;
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${festival.slug}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    close();
  };

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      disabled={!hasDate}
      aria-label="Ajouter à mon agenda"
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <CalendarIcon className="h-4 w-4 text-fuchsia-600" />
      Ajouter à mon agenda
    </button>
  );

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            onClick={close}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Ajouter ${festival.name} à mon agenda`}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md space-y-3 rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Ajouter à mon agenda
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Fermer"
                  className="-mr-1 -mt-1 rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  ✕
                </button>
              </div>

              <button
                type="button"
                onClick={downloadIcs}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
              >
                <CalendarIcon className="h-4 w-4" />
                Télécharger le fichier .ics
              </button>

              {gcalUrl && (
                <a
                  href={gcalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-100 px-4 py-3 font-semibold text-fuchsia-700 transition-colors hover:bg-fuchsia-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:bg-fuchsia-950 dark:text-fuchsia-200"
                >
                  Google Agenda ↗
                </a>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {trigger}
      {modal}
    </>
  );
}
