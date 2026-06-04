import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site BPMap.",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Mentions légales</h1>
      <div className="mt-6 space-y-6 text-zinc-700 dark:text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Éditeur
          </h2>
          <p className="mt-1">
            Le site BPMap est édité à titre non professionnel par un particulier.
            Conformément à l&apos;article 6, III-2 de la loi n°&nbsp;2004-575 du 21 juin
            2004 (LCEN), l&apos;éditeur a choisi de préserver son anonymat&nbsp;; ses
            éléments d&apos;identification personnelle ont été communiqués à
            l&apos;hébergeur ci-dessous.
            <br />
            Contact&nbsp;:{" "}
            <a
              href="mailto:mco94.pro@gmail.com"
              className="text-fuchsia-700 underline underline-offset-2 dark:text-fuchsia-400"
            >
              mco94.pro@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Directeur de la publication
          </h2>
          <p className="mt-1">L&apos;éditeur du site.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Hébergeur
          </h2>
          <p className="mt-1">
            Vercel Inc.
            <br />
            340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
            <br />
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-700 underline underline-offset-2 dark:text-fuchsia-400"
            >
              vercel.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Propriété intellectuelle
          </h2>
          <p className="mt-1">
            Le code et la présentation du site sont la propriété de l&apos;éditeur.
            Les informations relatives aux festivals proviennent de sources tierces,
            sous leurs licences respectives (voir{" "}
            <a
              href="/sources"
              className="text-fuchsia-700 underline underline-offset-2 dark:text-fuchsia-400"
            >
              Sources &amp; licences
            </a>
            ).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Responsabilité
          </h2>
          <p className="mt-1">
            Les informations (dates, prix, programmations, lieux) sont fournies à
            titre indicatif et peuvent évoluer. Vérifiez toujours auprès des
            organisateurs officiels avant tout déplacement ou achat. L&apos;éditeur
            ne saurait être tenu responsable d&apos;erreurs ou d&apos;omissions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Contact &amp; signalement
          </h2>
          <p className="mt-1">
            Pour toute question, rectification ou demande de retrait&nbsp;:{" "}
            <a
              href="mailto:mco94.pro@gmail.com"
              className="text-fuchsia-700 underline underline-offset-2 dark:text-fuchsia-400"
            >
              mco94.pro@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
