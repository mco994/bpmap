import Explorer from "@/components/Explorer";
import { getAllFestivals } from "@/lib/festivals";

export default function Home() {
  const festivals = getAllFestivals();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Les festivals de musique électronique en France
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Explorez la carte et filtrez par genre, date, organisateur, taille et
          prix pour trouver votre prochain festival&nbsp;: techno, house,
          drum&apos;n&apos;bass, French touch et plus encore.
        </p>
      </div>
      <Explorer festivals={festivals} />
    </div>
  );
}
