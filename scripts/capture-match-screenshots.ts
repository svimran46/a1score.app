import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

const PORT = 8080;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ARTIFACT_DIR = "C:/Users/User/.gemini/antigravity/brain/fba22140-55e8-4e1f-a357-ac9736cfbef8/phase-b-screenshots";

function checkServer(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/`, { timeout: 2000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServer(): Promise<ChildProcess | null> {
  const isUp = await checkServer();
  if (isUp) return null;

  console.log("Starting Next.js production server on port", PORT);
  const child = spawn("cmd", ["/c", "npx", "next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
    stdio: "ignore",
    detached: false,
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await checkServer()) {
      console.log("Next.js server is ready!");
      return child;
    }
  }

  throw new Error("Failed to start local server.");
}

const MATCHES = [
  { id: "5181852", name: "live_spain_croatia" },
  { id: "5181896", name: "finished_finland_belarus" },
  { id: "5991952", name: "upcoming_usvi_bahamas" },
];

const VIEWPORTS = [
  { name: "360x640", width: 360, height: 640 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

async function run() {
  const serverProc = await ensureServer();

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const manifest: any[] = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      for (const m of MATCHES) {
        console.log(`Loading match ${m.name} (${m.id})...`);
        const url = `${BASE_URL}/matches/${m.id}`;
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

        // 1. Capture Top Scorecard view
        const topShotName = `${m.name}_${vp.name}_top.png`;
        const topShotPath = path.join(ARTIFACT_DIR, topShotName);
        await page.screenshot({ path: topShotPath, fullPage: false });
        manifest.push({ match: m.name, viewport: vp.name, view: "top", file: topShotName });

        // 2. On 390x844 and 1440x900, also test scrolling to verify sticky compact bar
        if (vp.name === "390x844" || vp.name === "1440x900") {
          await page.evaluate(() => window.scrollBy(0, 500));
          await page.waitForTimeout(400);
          const stickyShotName = `${m.name}_${vp.name}_sticky.png`;
          const stickyShotPath = path.join(ARTIFACT_DIR, stickyShotName);
          await page.screenshot({ path: stickyShotPath, fullPage: false });
          manifest.push({ match: m.name, viewport: vp.name, view: "sticky", file: stickyShotName });
          // Scroll back up
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(300);
        }

        // 3. For the live match (Spain vs Croatia), capture each tab at 390px and 1440px
        if (m.id === "5181852" && (vp.name === "390x844" || vp.name === "1440x900")) {
          const tabs = ["lineup", "stats", "table", "h2h", "values"];
          for (const tabId of tabs) {
            const tabButton = page.locator(`#tab-${tabId}`);
            if (await tabButton.count()) {
              await tabButton.click();
              await page.waitForTimeout(300);
              const tabShotName = `live_tab_${tabId}_${vp.name}.png`;
              const tabShotPath = path.join(ARTIFACT_DIR, tabShotName);
              await page.screenshot({ path: tabShotPath, fullPage: false });
              manifest.push({ match: m.name, viewport: vp.name, view: `tab_${tabId}`, file: tabShotName });
            }
          }
        }
      }

      await context.close();
    }

    fs.writeFileSync(path.join(ARTIFACT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`\nSuccessfully captured ${manifest.length} screenshots to ${ARTIFACT_DIR}`);
  } finally {
    await browser.close();
    if (serverProc) {
      serverProc.kill();
    }
  }
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
