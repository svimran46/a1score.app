import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = "C:\\Users\\User\\.gemini\\antigravity\\brain\\6bac44ca-cce1-4c09-ab26-35a88926e493";
const OUT_DIR = path.join(ARTIFACT_DIR, "design-system-screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const APP_URL = "http://127.0.0.1:4000";

const VIEWPORTS = [
  { name: "360px", width: 360, height: 800 },
  { name: "390px", width: 390, height: 844 },
  { name: "768px", width: 768, height: 1024 },
  { name: "1280px", width: 1280, height: 800 },
];

const THEMES = ["dark", "light"];

const PAGES = [
  { name: "home", path: "/" },
  { name: "players", path: "/players" },
  { name: "matches", path: "/matches" },
  { name: "clubs", path: "/clubs" },
  { name: "leagues", path: "/leagues" },
  { name: "player_detail", path: "/players/lamine-yamal-937958" },
];

async function run() {
  console.log("Starting Design System Verification & Screenshot Capture...");

  let browser;
  try {
    browser = await chromium.launch({
      executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (err) {
    console.log("Falling back to bundled chromium...", err.message);
    browser = await chromium.launch({ headless: true });
  }

  let totalCaptures = 0;
  let overflowIssues = 0;

  for (const theme of THEMES) {
    console.log(`\n================ THEME: ${theme.toUpperCase()} ================`);

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      // Ensure theme is set before page scripts run
      await context.addInitScript((th) => {
        try {
          localStorage.setItem("theme", th);
        } catch (_) {}
      }, theme);

      const page = await context.newPage();

      for (const p of PAGES) {
        const url = `${APP_URL}${p.path}`;
        const filename = `${p.name}_${theme}_${vp.name}.png`;
        const outPath = path.join(OUT_DIR, filename);

        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
          await page.waitForTimeout(600); // Allow render & fonts

          // Check for horizontal overflow
          const overflow = await page.evaluate(() => {
            const doc = document.documentElement;
            const body = document.body;
            return {
              docScrollWidth: doc.scrollWidth,
              docClientWidth: doc.clientWidth,
              bodyScrollWidth: body.scrollWidth,
              hasOverflow: doc.scrollWidth > doc.clientWidth + 1 || body.scrollWidth > doc.clientWidth + 1,
            };
          });

          if (overflow.hasOverflow) {
            console.warn(`⚠️ OVERFLOW DETECTED: [${theme}] ${p.name} @ ${vp.name}: doc=${overflow.docScrollWidth} vs ${overflow.docClientWidth}`);
            overflowIssues++;
          }

          await page.screenshot({ path: outPath, fullPage: false });
          totalCaptures++;
          console.log(`✓ [${theme}] ${p.name} @ ${vp.name} -> ${filename} (Overflow: ${overflow.hasOverflow ? "YES" : "NO"})`);
        } catch (err) {
          console.error(`✗ Error capturing [${theme}] ${p.name} @ ${vp.name}:`, err.message);
        }
      }

      await context.close();
    }
  }

  await browser.close();
  console.log(`\nDone! Captured ${totalCaptures} screenshots. Horizontal overflow issues: ${overflowIssues}`);
}

run().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
