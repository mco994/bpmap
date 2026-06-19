"use client";

import {
  toggleFollowedArtist,
  useIsFollowedArtist,
} from "@/lib/followed-artists";

export default function FollowArtistButton({
  slug,
  withLabel = false,
}: {
  slug: string;
  withLabel?: boolean;
}) {
  const isFollowed = useIsFollowedArtist(slug);

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={() => toggleFollowedArtist(slug)}
        aria-pressed={isFollowed}
        className={`inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
          isFollowed
            ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300"
            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        }`}
      >
        <span aria-hidden>{isFollowed ? "★" : "☆"}</span>
        {isFollowed ? "Suivi" : "Suivre"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFollowedArtist(slug);
      }}
      aria-pressed={isFollowed}
      aria-label={isFollowed ? "Ne plus suivre cet artiste" : "Suivre cet artiste"}
      className={`rounded-full p-1.5 text-base leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
        isFollowed
          ? "text-fuchsia-600 dark:text-fuchsia-400"
          : "text-zinc-400 hover:text-fuchsia-600 dark:text-zinc-500 dark:hover:text-fuchsia-400"
      }`}
    >
      <span aria-hidden>{isFollowed ? "★" : "☆"}</span>
    </button>
  );
}
