import { genreLabel } from "@bpmap/shared";
import { genreColor, withAlpha } from "@/lib/genre-colors";

export default function GenreChips({
  genres,
  highlight,
}: {
  genres: string[];
  highlight?: string;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-1" aria-label="Genres">
      {genres.map((g) => {
        const active = g === highlight;
        const color = genreColor(g);
        return (
          <li
            key={g}
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={
              active
                ? { backgroundColor: color, color: "#ffffff" }
                : { backgroundColor: withAlpha(color, 0.14), color }
            }
          >
            {genreLabel(g)}
          </li>
        );
      })}
    </ul>
  );
}
