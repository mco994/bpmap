interface Partner {
  matches: (host: string) => boolean;
  envKey: string;
  param: string;
}

const PARTNERS: Partner[] = [
  {
    matches: (host) => host.includes("shotgun"),
    envKey: "NEXT_PUBLIC_SHOTGUN_AFFILIATE",
    param: "aff",
  },
  {
    matches: (host) => host.includes("ra.co") || host.includes("residentadvisor"),
    envKey: "NEXT_PUBLIC_RA_AFFILIATE",
    param: "aff",
  },
  {
    matches: (host) => host.includes("dice.fm"),
    envKey: "NEXT_PUBLIC_DICE_AFFILIATE",
    param: "aff",
  },
];

export function affiliateUrl(url: string | null): string | null {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const partner = PARTNERS.find((p) => p.matches(host));
    if (!partner) return url;
    const id = process.env[partner.envKey];
    if (!id) return url;
    parsed.searchParams.set(partner.param, id);
    return parsed.toString();
  } catch {
    return url;
  }
}
