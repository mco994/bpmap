import {
  effectiveStatus,
  priceFrom,
  sanitizeUrl,
  type Festival,
} from "@bpmap/shared";

function eventStatusUrl(festival: Festival, now: Date): string {
  const status = effectiveStatus(festival, now);
  if (status === "cancelled") return "https://schema.org/EventCancelled";
  return "https://schema.org/EventScheduled";
}

function offerAvailability(festival: Festival, now: Date): string {
  const status = effectiveStatus(festival, now);
  if (status === "cancelled") return "https://schema.org/Discontinued";
  if (status === "passed") return "https://schema.org/SoldOut";
  return "https://schema.org/InStock";
}

export function festivalJsonLd(festival: Festival, url: string, now: Date) {
  if (!festival.startDate) return null;
  const price = priceFrom(festival);

  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: festival.name,
    description: festival.description,
    image: `${url}/opengraph-image`,
    startDate: festival.startDate,
    ...(festival.endDate && { endDate: festival.endDate }),
    eventStatus: eventStatusUrl(festival, now),
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
    ...(festival.organizer && {
      organizer: { "@type": "Organization", name: festival.organizer },
    }),
    ...(festival.lineup?.length && {
      performer: festival.lineup.map((name) => ({
        "@type": "MusicGroup",
        name,
      })),
    }),
    ...(price !== null && {
      offers: {
        "@type": "Offer",
        price,
        priceCurrency: festival.currency,
        url: sanitizeUrl(festival.ticketUrl) ?? sanitizeUrl(festival.officialUrl) ?? url,
        availability: offerAvailability(festival, now),
      },
    }),
    url,
  };
}
