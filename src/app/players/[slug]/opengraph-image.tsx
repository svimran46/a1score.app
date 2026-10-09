import React from "react";
import { ImageResponse } from "next/og";
import { getPlayerProfile } from "@/lib/data/playerProfile";
import { OG_COLORS } from "@/lib/og/colors";
import { playerShareCardModel, type PlayerShareCardModel } from "@/components/players/playerCardModel";

export const runtime = "edge";
export const alt = "Player market value | a1score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600; // Hourly revalidation

const FONT = "system-ui, -apple-system, sans-serif";
const PHOTO_TIMEOUT_MS = 1500;
const PHOTO_MAX_BYTES = 1_500_000;

/**
 * Fetches the photo ourselves so a slow image host can never hold the card
 * past 1.5s; returns a data URL, or null so the initials monogram is used.
 */
async function loadPhoto(url: string | null): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PHOTO_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !/^image\/(png|jpe?g|webp|gif)/i.test(type)) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > PHOTO_MAX_BYTES) return null;
    let binary = "";
    for (let i = 0; i < buf.length; i += 0x8000) {
      binary += String.fromCharCode(...Array.from(buf.subarray(i, i + 0x8000)));
    }
    return `data:${type.split(";")[0]};base64,${btoa(binary)}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function BrandCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: OG_COLORS.bgPage,
        padding: "64px",
        fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", fontSize: "88px", fontWeight: 800, color: OG_COLORS.textPrimary }}>a1score</div>
      <div style={{ display: "flex", fontSize: "40px", color: OG_COLORS.textSecondary, marginTop: "16px" }}>
        Money meets the pitch
      </div>
    </div>
  );
}

function PlayerCard({ model, photo }: { model: PlayerShareCardModel; photo: string | null }) {
  const deltaColor =
    model.delta?.direction === "up"
      ? OG_COLORS.trendUp
      : model.delta?.direction === "down"
        ? OG_COLORS.trendDown
        : OG_COLORS.textSecondary;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: OG_COLORS.bgPage,
        padding: "64px",
        fontFamily: FONT,
        color: OG_COLORS.textPrimary,
      }}
    >
      {/* Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
        <div
          style={{
            width: "200px",
            height: "200px",
            borderRadius: "100px",
            overflow: "hidden",
            backgroundColor: OG_COLORS.bgChip,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={200} height={200} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          ) : (
            <span style={{ fontSize: "72px", fontWeight: 700, color: OG_COLORS.textSecondary }}>{model.initials}</span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "block",
              lineClamp: 2,
              fontSize: `${model.nameSize}px`,
              fontWeight: 800,
              lineHeight: 1.08,
              color: OG_COLORS.textPrimary,
            }}
          >
            {model.name}
          </div>
          {model.meta && (
            <div style={{ display: "flex", fontSize: "28px", color: OG_COLORS.textSecondary, marginTop: "12px" }}>
              {model.meta}
            </div>
          )}
        </div>
      </div>

      {/* Value */}
      {model.value ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "26px", color: OG_COLORS.textMuted }}>{model.label}</div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: "150px",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: OG_COLORS.valueText,
            }}
          >
            <span style={{ fontSize: "93px", fontWeight: 700 }}>{model.value.currency}</span>
            <span>{model.value.number}</span>
            {model.value.suffix && <span style={{ fontSize: "93px", fontWeight: 700 }}>{model.value.suffix}</span>}
          </div>
          {model.delta && (
            <div style={{ display: "flex", fontSize: "32px", marginTop: "8px" }}>
              <span style={{ fontWeight: 700, color: deltaColor }}>{model.delta.lead}</span>
              {model.delta.basis && (
                <span style={{ color: OG_COLORS.textMuted, whiteSpace: "pre" }}>{model.delta.basis}</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", fontSize: "44px", color: OG_COLORS.textMuted }}>No market value on record</div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "24px", color: OG_COLORS.textMuted }}>
        <span>{model.freshness ?? ""}</span>
        <span style={{ color: OG_COLORS.textSecondary, fontWeight: 700 }}>a1score.app</span>
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: { slug: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const vm = await getPlayerProfile(resolvedParams.slug).catch(() => null);

  if (!vm) {
    return new ImageResponse(<BrandCard />, { ...size });
  }

  const model = playerShareCardModel(vm);
  const photo = await loadPhoto(model.photoUrl);

  return new ImageResponse(<PlayerCard model={model} photo={photo} />, { ...size });
}
