import Link from "next/link";
import { artistSlug } from "@bpmap/shared";

export default function ArtistLinks({ lineup }: { lineup?: string[] }) {
  if (!lineup || lineup.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {lineup.map((name) => (
        <li key={name}>
          <Link
            href={`/artistes/${artistSlug(name)}`}
            className="inline-block rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:border-fuchsia-400 hover:text-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-fuchsia-600 dark:hover:text-fuchsia-300"
          >
            {name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
