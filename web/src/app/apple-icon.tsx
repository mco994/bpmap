import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const bars = [
    { h: 42, w: 14 },
    { h: 78, w: 14 },
    { h: 32, w: 14 },
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "12px",
          paddingBottom: "62px",
          backgroundImage:
            "linear-gradient(135deg, #6d28d9 0%, #c026d3 55%, #d946ef 100%)",
        }}
      >
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              width: `${b.w}px`,
              height: `${b.h}px`,
              background: "#ffffff",
              borderRadius: "7px",
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
