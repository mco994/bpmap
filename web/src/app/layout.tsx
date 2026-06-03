import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BPMap — Carte des événements de musique électronique en France",
    template: "%s · BPMap",
  },
  description:
    "L'annuaire et la carte interactive des événements de musique électronique en France : festivals, open airs et soirées — techno, house, drum'n'bass, French touch. Filtrez par type, genre, date, taille et prix.",
  keywords: [
    "événements musique électronique",
    "festival techno France",
    "open air électro",
    "soirée techno",
    "carte événements électro",
    "agenda électro France",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "BPMap",
    title: "BPMap — Carte des événements de musique électronique en France",
    description:
      "La carte interactive des événements électro français : festivals, open airs, soirées. Filtrez par type, genre, date, taille et prix.",
    url: SITE_URL,
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-fuchsia-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-zinc-200 bg-white py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <p>
            BPMap — l&apos;annuaire des événements de musique électronique
            français.
          </p>
          <nav
            aria-label="Liens légaux"
            className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1"
          >
            <Link
              href="/mentions-legales"
              className="hover:text-zinc-700 hover:underline dark:hover:text-zinc-300"
            >
              Mentions légales
            </Link>
            <Link
              href="/confidentialite"
              className="hover:text-zinc-700 hover:underline dark:hover:text-zinc-300"
            >
              Confidentialité
            </Link>
            <Link
              href="/sources"
              className="hover:text-zinc-700 hover:underline dark:hover:text-zinc-300"
            >
              Sources &amp; licences
            </Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
