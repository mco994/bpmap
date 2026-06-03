import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment BPMap traite (le minimum de) données : pas de compte, mesure d'audience sans cookies, données mobiles locales.",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">
        Politique de confidentialité
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Dernière mise à jour&nbsp;: juin 2026
      </p>
      <div className="mt-6 space-y-6 text-zinc-700 dark:text-zinc-300">
        <p>BPMap est conçu pour collecter le strict minimum de données.</p>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Données personnelles
          </h2>
          <p className="mt-1">
            Le site ne propose ni compte, ni formulaire, ni inscription&nbsp;:
            aucune donnée personnelle identifiante n&apos;est collectée auprès des
            visiteurs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Mesure d&apos;audience
          </h2>
          <p className="mt-1">
            Le site peut utiliser Vercel Analytics et Speed Insights, des outils de
            mesure d&apos;audience <strong>sans cookies</strong> et{" "}
            <strong>anonymisés</strong> (aucun profilage, aucun traceur
            publicitaire). Aucun bandeau cookies n&apos;est donc nécessaire.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Application mobile
          </h2>
          <p className="mt-1">
            Dans l&apos;application mobile, les favoris, les rappels et la position
            (pour les itinéraires) sont traités <strong>localement sur votre
            appareil</strong> et ne sont <strong>jamais envoyés</strong> à un
            serveur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Partage
          </h2>
          <p className="mt-1">
            Aucune donnée n&apos;est vendue ni partagée à des tiers à des fins
            commerciales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Vos droits
          </h2>
          <p className="mt-1">
            Pour toute question relative à vos données&nbsp;:{" "}
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
            Évolutions
          </h2>
          <p className="mt-1">
            Si des fonctionnalités impliquant des données personnelles (compte,
            notifications push) sont ajoutées, cette politique sera mise à jour en
            conséquence.
          </p>
        </section>
      </div>
    </div>
  );
}
