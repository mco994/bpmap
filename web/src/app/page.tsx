import Link from "next/link";
import MapExplorer from "@/components/MapExplorer";
import { getAllFestivals } from "@bpmap/shared";

export default function Home() {
  const festivals = getAllFestivals();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          La carte des événements de musique électronique en France
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Festivals, open airs et soirées — explorez la carte par type, genre,
          date, taille et prix, ou parcourez le{" "}
          <Link
            href="/festivals"
            className="font-medium text-fuchsia-700 hover:underline dark:text-fuchsia-400"
          >
            sommaire des événements
          </Link>
          .
        </p>
      </div>
      <MapExplorer festivals={festivals} />
    </div>
  );
}
