import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function generateAssets() {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. og-default.png (1200 x 630)
  const ogSvg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0e17" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#050811" />
      </linearGradient>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#f59e0b" />
      </linearGradient>
      <radialGradient id="glow" cx="20%" cy="20%" r="50%">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
      </radialGradient>
    </defs>
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bgGrad)" />
    <circle cx="250" cy="200" r="400" fill="url(#glow)" />
    
    <!-- Accent line -->
    <rect x="100" y="140" width="80" height="6" rx="3" fill="#10b981" />

    <!-- Brand Tag -->
    <text x="100" y="210" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="28" fill="#38bdf8" letter-spacing="4">
      FOOTBALL INTELLIGENCE &amp; VALUATION
    </text>

    <!-- Main Title -->
    <text x="100" y="310" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="64" fill="#f8fafc" letter-spacing="-1">
      a1score.app
    </text>

    <text x="100" y="380" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="44" fill="url(#textGrad)">
      Money meets the pitch
    </text>

    <!-- Subtitle / Meta -->
    <text x="100" y="470" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="24" fill="#94a3b8">
      Real-time match centers, verified market valuations &amp; squad analytics.
    </text>

    <!-- Bottom border subtle accent -->
    <rect x="0" y="622" width="1200" height="8" fill="url(#textGrad)" />
  </svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile(path.join(publicDir, "og-default.png"));
  console.log("✓ Generated public/og-default.png (1200x630)");

  // 2. Icon 512x512
  const iconSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="112" fill="url(#iconBg)" />
    <rect x="24" y="24" width="464" height="464" rx="96" fill="none" stroke="#1e293b" stroke-width="8" />
    <text x="256" y="320" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="220" fill="url(#accent)">
      A1
    </text>
  </svg>
  `;

  const icon512Buffer = await sharp(Buffer.from(iconSvg)).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, "icon-512.png"), icon512Buffer);
  console.log("✓ Generated public/icon-512.png (512x512)");

  // 3. Icon 192x192
  await sharp(icon512Buffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, "icon-192.png"));
  console.log("✓ Generated public/icon-192.png (192x192)");

  // 4. Apple Touch Icon 180x180
  await sharp(icon512Buffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("✓ Generated public/apple-touch-icon.png (180x180)");

  // 5. Favicon 32x32 PNG inside standard ICO container
  const icon32Png = await sharp(icon512Buffer).resize(32, 32).png().toBuffer();

  // ICO format wrapping PNG
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const icoEntry = Buffer.alloc(16);
  icoEntry.writeUInt8(32, 0); // Width
  icoEntry.writeUInt8(32, 1); // Height
  icoEntry.writeUInt8(0, 2); // Color palette
  icoEntry.writeUInt8(0, 3); // Reserved
  icoEntry.writeUInt16LE(1, 4); // Color planes
  icoEntry.writeUInt16LE(32, 6); // Bits per pixel
  icoEntry.writeUInt32LE(icon32Png.length, 8); // Image data size
  icoEntry.writeUInt32LE(22, 12); // Offset (6 header + 16 entry = 22)

  const icoBuffer = Buffer.concat([icoHeader, icoEntry, icon32Png]);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);
  console.log("✓ Generated public/favicon.ico (standard ICO format)");
}

generateAssets().catch((err) => {
  console.error("Asset generation error:", err);
  process.exit(1);
});
