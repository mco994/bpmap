import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sources & licences",
  description:
    "Origine et licences des données de BPMap : DATAtourisme, OpenStreetMap, Wikidata, BAN, OpenAgenda, Resident Advisor, Shotgun.",
  alternates: { canonical: "/sources" },
};

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Sources &amp; licences</h1>
      <div className="mt-6 space-y-6 text-zinc-700 dark:text-zinc-300">
        <p>
          Les informations de BPMap sont agrégées, normalisées et vérifiées à
          partir de sources ouvertes et spécialisées. Chaque fiche festival affiche
          en outre ses propres sources vérifiées.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Données
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>DATAtourisme</strong> — données touristiques officielles, sous
              Licence Ouverte / ODbL (attribution requise).
            </li>
            <li>
              <strong>OpenStreetMap</strong> — © les contributeurs OpenStreetMap,
              sous ODbL ; fond de carte via <strong>OpenFreeMap</strong>.
            </li>
            <li>
              <strong>Wikidata</strong> — sous licence CC0 (domaine public).
            </li>
            <li>
              <strong>Base Adresse Nationale (BAN)</strong> — géocodage des villes,
              sous Licence Ouverte.
            </li>
            <li>
              <strong>OpenAgenda</strong> — agendas culturels.
            </li>
            <li>
              <strong>Resident Advisor</strong>, <strong>Shotgun</strong> —
              programmations et billetterie (liens vers les sources d&apos;origine).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Cartographie
          </h2>
          <p className="mt-1">
            © les contributeurs OpenStreetMap — tuiles OpenFreeMap.
            L&apos;attribution est également affichée directement sur la carte.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Données indicatives
          </h2>
          <p className="mt-1">
            Dates, prix, capacités et programmations sont indicatifs et susceptibles
            d&apos;évoluer&nbsp;; ils sont à vérifier auprès des organisateurs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Signalement
          </h2>
          <p className="mt-1">
            Une erreur, une source à créditer ou à retirer&nbsp;? Écrivez à{" "}
            <a
              href="mailto:mco94.pro@gmail.com"
              className="text-fuchsia-700 underline underline-offset-2 dark:text-fuchsia-400"
            >
              mco94.pro@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Code
          </h2>
          <p className="mt-1">© BPMap — tous droits réservés à l&apos;éditeur.</p>
        </section>
      </div>
    </div>
  );
}
