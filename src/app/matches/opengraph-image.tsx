import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Live Matches — Real-Time Scores & Squad Values";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: "column",
          backgroundColor: "#0B0F17",
          color: "#F2F4F8",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#F5B73B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0B0F17",
              fontWeight: 900,
              fontSize: "24px",
            }}
          >
            A1
          </div>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#F2F4F8" }}>
            a1score<span style={{ color: "#F5B73B" }}>.app</span>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
          <span
            style={{
              color: "#F5B73B",
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            Live scores & squad values
          </span>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 600,
              lineHeight: 1.1,
              margin: 0,
              color: "#F2F4F8",
              letterSpacing: "-1px",
            }}
          >
            Live Matches & Squad Values
          </h1>
          <p
            style={{
              fontSize: "22px",
              color: "#A3ABBC",
              marginTop: "16px",
              marginBottom: 0,
              lineHeight: 1.4,
            }}
          >
            Real-time match events, confirmed starting lineups, and squad market values across European competitions.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #1e293b",
            paddingTop: "24px",
            fontSize: "16px",
            color: "#64748b",
          }}
        >
          <span>Tactical 2D Pitch Lineups • OPTA Match Stats</span>
          <span>Edge Auto-Refresher • Tabular Numerals</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
