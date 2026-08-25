import { genreLabel } from "@bpmap/shared";

type Tone = "auto" | "light";

export default function GenreChips({
  genres,
  highlight,
  tone = "auto",
}: {
  genres: string[];
  highlight?: string;
  tone?: Tone;
}) {
  return (
    <ul
      data-tone={tone}
      className="flex flex-wrap items-center gap-1"
      aria-label="Genres"
    >
      {genres.map((slug) => (
        <li
          key={slug}
          data-active={slug === highlight ? "" : undefined}
          className={`genre-${slug} rounded-full px-2 py-0.5 text-[11px] font-semibold`}
        >
          {genreLabel(slug)}
        </li>
      ))}
    </ul>
  );
}
