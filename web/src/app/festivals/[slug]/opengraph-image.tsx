import { ImageResponse } from "next/og";
import {
  getAllFestivals,
  getFestivalBySlug,
  formatDateRange,
  formatFromPrice,
  genreLabel,
} from "@bpmap/shared";

export const alt = "Événement sur BPMap";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllFestivals().map((f) => ({ slug: f.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const festival = getFestivalBySlug(slug);

  const name = festival?.name ?? "Événement";
  const place = festival
    ? `${festival.city} · ${formatDateRange(festival.startDate, festival.endDate)}`
    : "";
  const genres = (festival?.genres ?? []).slice(0, 4).map(genreLabel);
  const price = festival ? formatFromPrice(festival) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundImage:
            "linear-gradient(135deg, #6d28d9 0%, #c026d3 55%, #d946ef 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "6px",
              height: "36px",
            }}
          >
            <div style={{ width: "9px", height: "18px", background: "#ffffff", borderRadius: "3px" }} />
            <div style={{ width: "9px", height: "36px", background: "#ffffff", borderRadius: "3px" }} />
            <div style={{ width: "9px", height: "26px", background: "#ffffff", borderRadius: "3px" }} />
          </div>
          <div style={{ fontSize: "30px", fontWeight: 700 }}>BPMap</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", fontSize: "70px", fontWeight: 800, lineHeight: 1.05 }}>
            {name}
          </div>
          {place ? (
            <div style={{ display: "flex", fontSize: "36px", color: "rgba(255,255,255,0.92)" }}>
              {place}
            </div>
          ) : null}
          {genres.length > 0 ? (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {genres.map((g) => (
                <div
                  key={g}
                  style={{
                    display: "flex",
                    fontSize: "24px",
                    padding: "7px 20px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.35)",
                  }}
                >
                  {g}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: "30px", fontWeight: 700 }}>{price}</div>
          <div style={{ display: "flex", fontSize: "26px", color: "rgba(255,255,255,0.8)" }}>
            bpmap.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
