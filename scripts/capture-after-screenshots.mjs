import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://127.0.0.1:4000";
const OUTPUT_DIR = path.resolve("docs/screenshots/after");

const PAGES = [
  { path: "/", name: "home" },
  { path: "/matches", name: "matches" },
  { path: "/players", name: "players" },
  { path: "/clubs", name: "clubs" },
  { path: "/leagues", name: "leagues" },
];

const VIEWPORTS = [
  { width: 360, height: 800, suffix: "360" },
  { width: 390, height: 844, suffix: "390" },
];

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ channel: "msedge", headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Capturing Viewport: ${vp.width}x${vp.height} ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      const url = `${BASE_URL}${p.path}`;
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      // Small pause for any animations/renders
      await page.waitForTimeout(1000);

      const filename = `${p.name}-${vp.suffix}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: false });
      console.log(`Captured: ${filename}`);
    }

    await context.close();
  }

  await browser.close();
  console.log("\nAll after screenshots successfully captured in docs/screenshots/after!");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
