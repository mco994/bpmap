import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "BPMap — Carte des festivals de musique électronique en France",
    template: "%s · BPMap",
  },
  description:
    "L'annuaire et la carte interactive des festivals de musique électronique en France : techno, house, drum'n'bass, French touch. Filtrez par genre, date, organisateur, taille et prix.",
  keywords: [
    "festival musique électronique",
    "festival techno France",
    "festival house",
    "carte festivals électro",
    "agenda festivals électroniques",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "BPMap",
    title: "BPMap — Carte des festivals de musique électronique en France",
    description:
      "La carte interactive des festivals électro français. Filtrez par genre, date, organisateur, taille et prix.",
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
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span aria-hidden className="text-xl">
                🎚️
              </span>
              <span className="text-lg">BPMap</span>
            </Link>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Festivals électro · France
            </span>
          </div>
        </header>
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-zinc-200 bg-white py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          BPMap — l&apos;annuaire des festivals de musique électronique
          français.
        </footer>
      </body>
    </html>
  );
}
