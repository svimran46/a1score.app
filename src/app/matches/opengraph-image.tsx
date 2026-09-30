import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Match Center — Live Scores & Financial Disparity Barometer";
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
          backgroundColor: "#09090b",
          backgroundImage: "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%)",
          backgroundSize: "40px 40px",
          color: "#fff",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#09090b",
              fontWeight: 900,
              fontSize: "24px",
            }}
          >
            A1
          </div>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#fff" }}>
            a1score<span style={{ color: "#f59e0b" }}>.app</span>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
          <span
            style={{
              color: "#f59e0b",
              fontSize: "18px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "3px",
              marginBottom: "12px",
            }}
          >
            Live Match Operations Center
          </span>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
              color: "#ffffff",
              letterSpacing: "-1px",
            }}
          >
            Match Center & Financial Disparity Barometer
          </h1>
          <p
            style={{
              fontSize: "22px",
              color: "#94a3b8",
              marginTop: "16px",
              marginBottom: 0,
              lineHeight: 1.4,
            }}
          >
            Confirmed Starting XI pitch coordinates, real-time match events, and economic disparity ratios comparing underdog lineups against market heavyweights.
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
