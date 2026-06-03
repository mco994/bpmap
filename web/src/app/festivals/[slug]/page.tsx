import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllFestivals,
  getFestivalBySlug,
  formatDateRange,
  formatPrice,
  genreLabel,
  sizeTierLabel,
  sizeTierForCapacity,
  effectiveStatus,
  statusLabel,
  effectiveEventType,
  eventTypeLabel,
  type Festival,
} from "@bpmap/shared";

export function generateStaticParams() {
  return getAllFestivals().map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const festival = getFestivalBySlug(slug);
  if (!festival) return { title: "Festival introuvable" };

  const year = festival.startDate
    ? ` ${new Date(festival.startDate).getFullYear()}`
    : "";
  const title = `${festival.name}${year}`;
  const description = `${festival.name} à ${festival.city} — ${formatDateRange(
    festival.startDate,
    festival.endDate,
  )}. ${festival.description}`;

  return {
    title,
    description,
    alternates: { canonical: `/festivals/${festival.slug}` },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      title: `${title} · BPMap`,
      description,
      url: `/festivals/${festival.slug}`,
    },
  };
}

function jsonLd(festival: Festival, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: festival.name,
    description: festival.description,
    ...(festival.startDate && { startDate: festival.startDate }),
    ...(festival.endDate && { endDate: festival.endDate }),
    eventStatus:
      festival.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: festival.city,
      address: {
        "@type": "PostalAddress",
        addressLocality: festival.city,
        addressRegion: festival.region,
        addressCountry: "FR",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: festival.lat,
        longitude: festival.lng,
      },
    },
    organizer: { "@type": "Organization", name: festival.organizer },
    // Only advertise an offer when we actually know the price.
    ...(festival.priceFull !== null && {
      offers: {
        "@type": "Offer",
        price: festival.priceFull,
        priceCurrency: festival.currency,
        url: festival.ticketUrl ?? festival.officialUrl ?? url,
        availability: "https://schema.org/InStock",
      },
    }),
    url,
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Label the outbound link according to where it actually points, so a Shotgun
// or ticketing link isn't mislabelled "Site officiel".
function siteLinkLabel(url: string): string {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Site officiel";
  }
  if (host.includes("shotgun")) return "Voir sur Shotgun";
  if (host.includes("ra.co") || host.includes("residentadvisor"))
    return "Voir sur Resident Advisor";
  if (host.includes("dice.fm")) return "Voir sur Dice";
  if (host.includes("helloasso")) return "Billetterie HelloAsso";
  if (host.includes("billetweb")) return "Billetterie Billetweb";
  if (host.includes("seetickets")) return "Billetterie See Tickets";
  if (host.includes("festivalenfrance") || host.includes("agendaculturel"))
    return "Plus d'infos";
  if (host.includes("stereolux")) return "Voir sur Stereolux";
  if (host.includes("halledelamachine")) return "Voir sur la Halle de la Machine";
  return "Site officiel";
}

const TICKET_HOSTS =
  /(shotgun\.live|dice\.fm|billetweb|helloasso|seetickets|weezevent|yurplan|festicket|billetreduc)/i;

function isTicketHost(url: string | null): boolean {
  return !!url && TICKET_HOSTS.test(url);
}

// The billetterie link: a known ticketing URL, or the official URL when it is
// itself a ticketing platform. Null when we have no reliable ticket link — we
// never guess (a wrong link is worse than none); the official site is used then.
function billetterieUrl(f: Festival): string | null {
  if (f.ticketUrl) return f.ticketUrl;
  if (isTicketHost(f.officialUrl)) return f.officialUrl;
  return null;
}

export default async function FestivalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const festival = getFestivalBySlug(slug);
  if (!festival) notFound();

  const url = `${SITE_URL}/festivals/${festival.slug}`;
  const status = effectiveStatus(festival);
  const tier = sizeTierForCapacity(festival.capacity);

  const info = [
    { icon: "👥", label: "Organisateur", value: festival.organizer ?? "—" },
    { icon: "📐", label: "Taille", value: tier ? sizeTierLabel(tier) : "—" },
    { icon: "🎟️", label: "Prix / jour", value: formatPrice(festival.priceDay) },
    { icon: "🎫", label: "Pass complet", value: formatPrice(festival.priceFull) },
  ];

  return (
    <article className="pb-12">
      <script
        type="application/ld+json"
        // JSON-LD for rich results; content is derived from trusted static data.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(festival, url)) }}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-700 via-fuchsia-600 to-fuchsia-500 text-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
          <nav aria-label="Fil d'Ariane" className="mb-6 text-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-white/90 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              ← Tous les festivals
            </Link>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            {(status === "passed" || status === "cancelled") && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  status === "cancelled"
                    ? "bg-red-500 text-white"
                    : "bg-black/30 text-white"
                }`}
              >
                {statusLabel(status)}
              </span>
            )}
            {festival.eclectic && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                Éclectique
              </span>
            )}
            {effectiveEventType(festival) !== "festival" && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                {eventTypeLabel(effectiveEventType(festival))}
              </span>
            )}
          </div>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight break-words sm:text-4xl md:text-5xl">
            {festival.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>📍</span>
              {festival.city}, {festival.region}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>🗓️</span>
              <time dateTime={festival.startDate ?? undefined}>
                {formatDateRange(festival.startDate, festival.endDate)}
              </time>
            </span>
          </div>

          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Genres">
            {festival.genres.map((g) => (
              <li
                key={g}
                className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium ring-1 ring-inset ring-white/25 backdrop-blur"
              >
                {genreLabel(g)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4">
        <p className="mt-8 text-base leading-relaxed text-zinc-700 sm:text-lg dark:text-zinc-300">
          {festival.description}
        </p>

        {festival.lineup && festival.lineup.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">À l&apos;affiche</h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Têtes d&apos;affiche annoncées (programmation partielle)
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {festival.lineup.map((a) => (
                <li
                  key={a}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {info.map((it) => (
            <div
              key={it.label}
              className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="text-xl" aria-hidden>
                {it.icon}
              </div>
              <dt className="mt-2 text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                {it.label}
              </dt>
              <dd className="mt-0.5 font-semibold break-words">{it.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          {billetterieUrl(festival) && (
            <a
              href={billetterieUrl(festival) as string}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="rounded-xl bg-fuchsia-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
            >
              🎟️ Billetterie
            </a>
          )}
          {festival.officialUrl && !isTicketHost(festival.officialUrl) && (
            <a
              href={festival.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {siteLinkLabel(festival.officialUrl)} ↗
            </a>
          )}
        </div>

        {festival.sources && festival.sources.length > 0 && (
          <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-500">
            Sources vérifiées&nbsp;:{" "}
            {festival.sources.map((s, i) => (
              <span key={s}>
                {i > 0 && " · "}
                <a
                  href={s}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  {(() => {
                    try {
                      return new URL(s).hostname.replace(/^www\./, "");
                    } catch {
                      return s;
                    }
                  })()}
                </a>
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
