import { ImageResponse } from "next/og";

export const alt =
  "BPMap — Carte des événements de musique électronique en France";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GENRES = ["Techno", "House", "Trance", "Drum'n'bass", "French touch"];

export default function Image() {
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
              gap: "7px",
              height: "44px",
            }}
          >
            <div style={{ width: "10px", height: "22px", background: "#ffffff", borderRadius: "3px" }} />
            <div style={{ width: "10px", height: "44px", background: "#ffffff", borderRadius: "3px" }} />
            <div style={{ width: "10px", height: "30px", background: "#ffffff", borderRadius: "3px" }} />
          </div>
          <div style={{ fontSize: "34px", fontWeight: 700 }}>BPMap</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "76px", fontWeight: 800, lineHeight: 1.05 }}>
            La carte des événements de musique électronique en France
          </div>
          <div style={{ fontSize: "34px", color: "rgba(255,255,255,0.92)" }}>
            Festivals, open airs et soirées — filtrez par genre, date, taille et prix.
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px" }}>
          {GENRES.map((g) => (
            <div
              key={g}
              style={{
                display: "flex",
                fontSize: "26px",
                padding: "8px 22px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.35)",
              }}
            >
              {g}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
