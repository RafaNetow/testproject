import { ImageResponse } from "next/og";

export const alt = "Alchemica — Chemistry & Materials Advisory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b1220 0%, #0e2f38 55%, #0f5e6e 100%)",
          color: "#f8fafc",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#7fd0dc",
            marginBottom: 28,
          }}
        >
          Chemistry &amp; Materials Advisory
        </div>
        <div style={{ display: "flex", fontSize: 84, lineHeight: 1.1, maxWidth: 980 }}>
          Fewer failed batches. Sharper next experiments.
        </div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 44, color: "#cbd5e1" }}>
          Alchemica
        </div>
      </div>
    ),
    { ...size }
  );
}
