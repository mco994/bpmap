import type { NextConfig } from "next";

const DEFAULT_MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
const ADDRESS_API_ORIGIN = "https://api-adresse.data.gouv.fr";

function mapTileOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_MAP_STYLE ?? DEFAULT_MAP_STYLE).origin;
  } catch {
    return new URL(DEFAULT_MAP_STYLE).origin;
  }
}

function contentSecurityPolicy(): string {
  const tiles = mapTileOrigin();
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (process.env.NODE_ENV !== "production") scriptSrc.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src 'self' data: blob: ${tiles}`,
    `connect-src 'self' ${tiles} ${ADDRESS_API_ORIGIN}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@bpmap/shared"],
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
