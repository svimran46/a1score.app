import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import os from "node:os";

const ARTIFACT_DIR = "C:\\Users\\User\\.gemini\\antigravity\\brain\\fba22140-55e8-4e1f-a357-ac9736cfbef8\\audit-screenshots";
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9888;
const USER_DATA_DIR = path.join(os.tmpdir(), `chrome_debug_${Date.now()}`);
const APP_URL = "http://127.0.0.1:8080";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      if (res.ok) {
        const list = await res.json();
        const page = list.find((item) => item.type === "page");
        if (page && page.webSocketDebuggerUrl) {
          return page.webSocketDebuggerUrl;
        }
      }
    } catch {
      // Chrome not ready yet
    }
    await sleep(500);
  }
  throw new Error("Could not connect to Chrome debugging port");
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 0;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve: res, reject: rej } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) {
              rej(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              res(msg.result);
            }
          }
        } catch (e) {
          console.error("CDP parse error:", e);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = ++this.msgId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function captureScreenshot(cdp, filePath) {
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  const buffer = Buffer.from(result.data, "base64");
  fs.writeFileSync(filePath, buffer);
  console.log(`Saved screenshot: ${filePath}`);
}

async function main() {
  console.log("Launching headless Chrome...");
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  try {
    const wsUrl = await getDebuggerUrl();
    console.log("Connected to Chrome:", wsUrl);

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");

    // 1. Mobile (390px x 844px)
    console.log("\n--- Capturing 390px (Mobile) ---");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await cdp.send("Page.navigate", { url: APP_URL });
    await sleep(2000);

    // 1a: Default header
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "390px_default_header.png"));

    // 1b: Drawer open
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector('button[aria-label="Open navigation menu"]')?.click();`,
    });
    await sleep(600);
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "390px_drawer_open.png"));

    // Close drawer
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector('button[aria-label="Close menu"]')?.click();`,
    });
    await sleep(400);

    // 1c: Search open
    await cdp.send("Page.navigate", { url: APP_URL });
    await sleep(1500);
    await cdp.send("Runtime.evaluate", {
      expression: `(document.querySelector('button[data-search-trigger="compact"]') || document.querySelector('button[title*="Search"]'))?.click();`,
    });
    await sleep(800);
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "390px_search_open.png"));

    // 2. Tablet (768px x 1024px)
    console.log("\n--- Capturing 768px (Tablet) ---");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await cdp.send("Page.navigate", { url: APP_URL });
    await sleep(2000);

    // 2a: Default header
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "768px_default_header.png"));

    // 2b: Drawer open
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector('button[aria-label="Open navigation menu"]')?.click();`,
    });
    await sleep(600);
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "768px_drawer_open.png"));

    // 2c: Search open
    await cdp.send("Page.navigate", { url: APP_URL });
    await sleep(1500);
    await cdp.send("Runtime.evaluate", {
      expression: `(document.querySelector('button[data-search-trigger="compact"]') || document.querySelector('button[title*="Search"]'))?.click();`,
    });
    await sleep(800);
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "768px_search_open.png"));

    // 3. Desktop (1440px x 900px)
    console.log("\n--- Capturing 1440px (Desktop) ---");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send("Page.navigate", { url: APP_URL });
    await sleep(2000);

    // 3a: Default header
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "1440px_default_header.png"));

    // 3b: Search open
    await cdp.send("Runtime.evaluate", {
      expression: `(document.querySelector('button[data-search-trigger="desktop"]') || document.querySelector('button[aria-label*="Search"]'))?.click();`,
    });
    await sleep(800);
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "1440px_search_open.png"));

    // 4. TV (1920px x 1080px)
    console.log("\n--- Capturing 1920px (TV) ---");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send("Page.navigate", { url: APP_URL });
    await sleep(2000);

    // 4a: Default header + collapsed TV rail (72px)
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "1920px_default_header_tv_rail.png"));

    // 4b: Expanded TV rail (hover / focus-within)
    await cdp.send("Runtime.evaluate", {
      expression: `
        const tvRail = document.querySelector('aside[aria-label="TV Quick Navigation"]');
        if (tvRail) {
          tvRail.classList.remove('w-[72px]');
          tvRail.classList.add('w-[240px]');
          tvRail.querySelectorAll('span').forEach(s => s.classList.remove('opacity-0'));
        }
      `,
    });
    await sleep(400);
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "1920px_tv_rail_expanded.png"));

    // 4c: Search open
    await cdp.send("Page.navigate", { url: APP_URL });
    await sleep(1500);
    await cdp.send("Runtime.evaluate", {
      expression: `(document.querySelector('button[data-search-trigger="desktop"]') || document.querySelector('button[aria-label*="Search"]'))?.click();`,
    });
    await sleep(800);
    await captureScreenshot(cdp, path.join(ARTIFACT_DIR, "1920px_search_open.png"));

    console.log("\nAll screenshots captured successfully!");
    cdp.close();
  } finally {
    chromeProcess.kill();
  }
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
