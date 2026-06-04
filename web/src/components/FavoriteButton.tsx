"use client";

import { toggleFavorite, useIsFavorite } from "@/lib/favorites";

export default function FavoriteButton({
  festivalId,
  withLabel = false,
}: {
  festivalId: string;
  withLabel?: boolean;
}) {
  const isFavorite = useIsFavorite(festivalId);

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={() => toggleFavorite(festivalId)}
        aria-pressed={isFavorite}
        className={`inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
          isFavorite
            ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300"
            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        }`}
      >
        <span aria-hidden>{isFavorite ? "♥" : "♡"}</span>
        {isFavorite ? "Suivi" : "Suivre"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(festivalId);
      }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Ne plus suivre" : "Suivre cet événement"}
      className={`rounded-full p-1.5 text-base leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
        isFavorite
          ? "text-pink-600 dark:text-pink-400"
          : "text-zinc-400 hover:text-pink-600 dark:text-zinc-500 dark:hover:text-pink-400"
      }`}
    >
      <span aria-hidden>{isFavorite ? "♥" : "♡"}</span>
    </button>
  );
}
