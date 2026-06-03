import type { Metadata } from "next";
import SommaireList from "@/components/SommaireList";
import { getAllFestivals } from "@bpmap/shared";

export const metadata: Metadata = {
  title: "Sommaire des événements électro",
  description:
    "La liste complète des événements de musique électronique en France — festivals, open airs, soirées : recherchez par nom ou ville et filtrez par type, genre, date, taille et prix.",
  alternates: { canonical: "/festivals" },
};

export default function FestivalsPage() {
  const festivals = getAllFestivals();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tous les événements de musique électronique en France
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Festivals, open airs et soirées — recherchez et filtrez parmi{" "}
          {festivals.length} événements : techno, house, drum&apos;n&apos;bass,
          French touch et plus encore.
        </p>
      </div>
      <SommaireList festivals={festivals} />
    </div>
  );
}
