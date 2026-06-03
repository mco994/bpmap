import type { Metadata } from "next";
import SommaireList from "@/components/SommaireList";
import { getAllFestivals } from "@bpmap/shared";

export const metadata: Metadata = {
  title: "Sommaire des festivals électro",
  description:
    "La liste complète des festivals de musique électronique en France : recherchez par nom ou ville et filtrez par genre, date, taille et prix.",
  alternates: { canonical: "/festivals" },
};

export default function FestivalsPage() {
  const festivals = getAllFestivals();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tous les festivals de musique électronique en France
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Recherchez et filtrez parmi {festivals.length} festivals — techno,
          house, drum&apos;n&apos;bass, French touch et plus encore.
        </p>
      </div>
      <SommaireList festivals={festivals} />
    </div>
  );
}
