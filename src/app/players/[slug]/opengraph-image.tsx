import React from "react";
import { ImageResponse } from "next/og";
import { getPlayerBySlugOrId } from "@/lib/data/players";
import { formatCompactEur } from "@/lib/utils";
import { calculate12MonthChange } from "@/lib/compare";
import { OG_COLORS } from "@/lib/og/colors";

export const runtime = "edge";
export const alt = "Player Market Valuation | a1score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600; // Hourly revalidation

function getInitials(name: string): string {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default async function Image({ params }: { params: { slug: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const player = await getPlayerBySlugOrId(resolvedParams.slug).catch(() => null);

  const displayName = player?.fullName || player?.commonName || resolvedParams.slug.replace(/-/g, " ");
  const clubName = player?.currentClub?.name || "Independent / Free Agent";
  const clubLogo = player?.currentClub?.logoUrl;
  const photoUrl = player?.photoUrl;
  const position = player?.position || "Footballer";

  const mvs = Array.isArray(player?.marketValues) ? player!.marketValues : [];
  const rawCurrent = player?.latestMarketValue || (mvs.length > 0 ? (mvs[mvs.length - 1].valueEur || mvs[mvs.length - 1].value) : 0);
  const currentVal = Number(rawCurrent) || 0;
  const formattedVal = currentVal > 0 ? formatCompactEur(currentVal) : "Pending";

  const change = calculate12MonthChange(mvs, currentVal);

  let changeLabel = "Stable (12m)";
  let changeColor: string = OG_COLORS.textMuted;
  if (change.diff > 0) {
    changeLabel = `▲ +${formatCompactEur(change.diff)} (+${change.pct.toFixed(1)}%)`;
    changeColor = OG_COLORS.trendUp;
  } else if (change.diff < 0) {
    changeLabel = `▼ -${formatCompactEur(Math.abs(change.diff))} (-${change.pct.toFixed(1)}%)`;
    changeColor = OG_COLORS.trendDown;
  }

  const initials = getInitials(displayName);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: OG_COLORS.bgPage,
          backgroundImage: `radial-gradient(circle at 25px 25px, ${OG_COLORS.divider} 1.5%, transparent 0%)`,
          backgroundSize: "40px 40px",
          padding: "48px 56px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: OG_COLORS.textPrimary,
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${OG_COLORS.amber400}, ${OG_COLORS.amber500})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: OG_COLORS.bgPage,
                fontWeight: 900,
                fontSize: "22px",
              }}
            >
              A1
            </div>
            <span style={{ fontSize: "26px", fontWeight: 800, color: OG_COLORS.white }}>
              a1score<span style={{ color: OG_COLORS.amber400 }}>.app</span>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: OG_COLORS.bgElevated,
              border: `1px solid ${OG_COLORS.divider}`,
              color: OG_COLORS.amber400,
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            Player Valuation Intelligence
          </div>
        </div>

        {/* Center Content Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "48px",
            width: "100%",
            flex: 1,
            marginTop: "16px",
            marginBottom: "16px",
          }}
        >
          {/* Left Column: Player Identity & Club */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "20px" }}>
              {/* Photo with Fallback Monogram */}
              <div
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "55px",
                  overflow: "hidden",
                  backgroundColor: OG_COLORS.bgElevated,
                  border: `3px solid ${OG_COLORS.divider}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={displayName}
                    width={110}
                    height={110}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                ) : (
                  <span style={{ fontSize: "40px", fontWeight: 800, color: OG_COLORS.amber400 }}>
                    {initials}
                  </span>
                )}
              </div>

              {/* Club Crest if reliably available */}
              {clubLogo ? (
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    backgroundColor: OG_COLORS.bgElevated,
                    border: `1.5px solid ${OG_COLORS.divider}`,
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={clubLogo}
                    alt={clubName}
                    width={48}
                    height={48}
                    style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%" }}
                  />
                </div>
              ) : null}
            </div>

            {/* Player Name */}
            <h1
              style={{
                fontSize: displayName.length > 20 ? "44px" : "54px",
                fontWeight: 900,
                lineHeight: 1.1,
                margin: "0 0 10px 0",
                color: OG_COLORS.textPrimary,
                letterSpacing: "-0.03em",
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </h1>

            {/* Position and Club Meta Ribbon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "20px",
                fontWeight: 600,
                color: OG_COLORS.textMuted,
              }}
            >
              <span>{clubName}</span>
              <span>•</span>
              <span style={{ color: OG_COLORS.amber400 }}>{position}</span>
            </div>
          </div>

          {/* Right Column: Valuation Card */}
          <div
            style={{
              backgroundColor: OG_COLORS.bgCard,
              border: `2px solid ${OG_COLORS.divider}`,
              borderRadius: "28px",
              padding: "36px 44px",
              minWidth: "400px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: OG_COLORS.textMuted,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
              }}
            >
              Current Market Value
            </span>

            <span
              style={{
                fontSize: "68px",
                fontWeight: 900,
                color: OG_COLORS.valueText,
                lineHeight: 1.05,
                margin: "14px 0 16px 0",
                letterSpacing: "-0.03em",
              }}
            >
              {formattedVal}
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 20px",
                borderRadius: "999px",
                backgroundColor: OG_COLORS.bgElevated,
                border: `1px solid ${OG_COLORS.divider}`,
                fontSize: "16px",
                fontWeight: 800,
                color: changeColor,
              }}
            >
              {changeLabel}
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: `1px solid ${OG_COLORS.divider}`,
            paddingTop: "18px",
            fontSize: "15px",
            color: OG_COLORS.textMuted,
          }}
        >
          <span>Grounded in Transfermarkt valuations & FotMob intelligence</span>
          <span>12-Month Financial Movement & Player Profile</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
