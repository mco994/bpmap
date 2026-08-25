import { genreLabel, genrePalette } from "@bpmap/shared";

type Tone = "auto" | "light";

const AUTO_CLASSES =
  "bg-[color:var(--chip-bg)] text-[color:var(--chip-fg)] dark:bg-[color:var(--chip-bg-dark)] dark:text-[color:var(--chip-fg-dark)]";
const LIGHT_CLASSES = "bg-[color:var(--chip-bg)] text-[color:var(--chip-fg)]";

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
    <ul className="flex flex-wrap items-center gap-1" aria-label="Genres">
      {genres.map((slug) => {
        const palette = genrePalette(slug);
        const active = slug === highlight;
        const style = active
          ? ({
              "--chip-bg": palette.solid,
              "--chip-fg": "#ffffff",
              "--chip-bg-dark": palette.solid,
              "--chip-fg-dark": "#ffffff",
            } as React.CSSProperties)
          : ({
              "--chip-bg": palette.light.bg,
              "--chip-fg": palette.light.fg,
              "--chip-bg-dark": palette.dark.bg,
              "--chip-fg-dark": palette.dark.fg,
            } as React.CSSProperties);

        return (
          <li
            key={slug}
            style={style}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              tone === "light" ? LIGHT_CLASSES : AUTO_CLASSES
            }`}
          >
            {genreLabel(slug)}
          </li>
        );
      })}
    </ul>
  );
}
