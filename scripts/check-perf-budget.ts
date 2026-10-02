import fs from "fs";
import path from "path";
import zlib from "zlib";

interface BudgetConfig {
  limits: {
    maxRouteJsKb: number;
    maxSharedJsKb: number;
    maxImageKb: number;
    maxFontKb: number;
    maxTotalPageWeightKb: number;
  };
  routes: Record<string, { maxJsKb: number }>;
  lighthouse: {
    thresholds: {
      performance: number;
      accessibility: number;
      lcpMs: number;
      cls: number;
      tbtMs: number;
    };
  };
}

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str : str + " ".repeat(len - str.length);
}

function padLeft(str: string, len: number): string {
  return str.length >= len ? str : " ".repeat(len - str.length) + str;
}

export function checkPerfBudgets(): boolean {
  console.log("\n=======================================================");
  console.log(" 🚀 a1score.app — Performance Budget & Guardrails Check");
  console.log("=======================================================\n");

  const budgetPath = path.join(process.cwd(), "perf-budget.json");
  if (!fs.existsSync(budgetPath)) {
    console.error("❌ perf-budget.json not found!");
    return false;
  }

  const budget: BudgetConfig = JSON.parse(fs.readFileSync(budgetPath, "utf-8"));
  let hasFailure = false;

  // 1. Check Next.js Build Manifests
  const nextDir = path.join(process.cwd(), ".next");
  const appManifestPath = path.join(nextDir, "app-build-manifest.json");

  if (fs.existsSync(appManifestPath)) {
    const appManifest = JSON.parse(fs.readFileSync(appManifestPath, "utf-8"));
    const pages = appManifest.pages || {};

    console.log("📦 JavaScript Bundle Sizes per Audited Route:");
    console.log("----------------------------------------------------------------------");
    console.log(
      `${padRight("Route", 24)} | ${padLeft("Bundle Size", 14)} | ${padLeft("Budget", 10)} | ${padLeft("Status", 8)}`
    );
    console.log("----------------------------------------------------------------------");

    for (const [routePattern, routeBudget] of Object.entries(budget.routes)) {
      // Map route pattern to manifest key (e.g. "/" -> "/page", "/news" -> "/news/page")
      let manifestKey = routePattern === "/" ? "/page" : `${routePattern}/page`;
      if (!pages[manifestKey]) {
        manifestKey = routePattern;
      }

      const chunks: string[] = pages[manifestKey] || [];
      let totalBytes = 0;

      for (const chunk of chunks) {
        const fullChunkPath = path.join(nextDir, chunk);
        if (fs.existsSync(fullChunkPath)) {
          const content = fs.readFileSync(fullChunkPath);
          totalBytes += zlib.gzipSync(content).length;
        }
      }

      const totalKb = totalBytes / 1024;
      const budgetKb = routeBudget.maxJsKb;
      const passed = totalKb <= budgetKb;

      if (!passed) hasFailure = true;

      console.log(
        `${padRight(routePattern, 24)} | ${padLeft(formatKb(totalBytes), 14)} | ${padLeft(`${budgetKb} kB`, 10)} | ${padLeft(passed ? "✅ PASS" : "❌ FAIL", 8)}`
      );
    }
    console.log("----------------------------------------------------------------------\n");
  } else {
    console.warn("⚠️  .next/app-build-manifest.json not found. Run 'npm run build' first to verify route JS budgets.");
  }

  // 2. Check Static Asset Sizes in public/
  const publicDir = path.join(process.cwd(), "public");
  if (fs.existsSync(publicDir)) {
    console.log("🖼️  Static Asset Weight Audits (public/):");
    console.log("----------------------------------------------------------------------");
    console.log(
      `${padRight("Asset File", 34)} | ${padLeft("Size", 12)} | ${padLeft("Max Limit", 10)} | ${padLeft("Status", 8)}`
    );
    console.log("----------------------------------------------------------------------");

    const assetFiles = fs.readdirSync(publicDir);
    for (const file of assetFiles) {
      const fullPath = path.join(publicDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        const sizeKb = stat.size / 1024;
        let limitKb = budget.limits.maxImageKb;
        let isAsset = false;

        if (/\.(png|jpg|jpeg|webp|avif|gif)$/i.test(ext)) {
          limitKb = budget.limits.maxImageKb;
          isAsset = true;
        } else if (/\.(woff|woff2|ttf|otf)$/i.test(ext)) {
          limitKb = budget.limits.maxFontKb;
          isAsset = true;
        }

        if (isAsset) {
          const passed = sizeKb <= limitKb;
          if (!passed) hasFailure = true;
          console.log(
            `${padRight(file.slice(0, 32), 34)} | ${padLeft(formatKb(stat.size), 12)} | ${padLeft(`${limitKb} kB`, 10)} | ${padLeft(passed ? "✅ PASS" : "❌ FAIL", 8)}`
          );
        }
      }
    }
    console.log("----------------------------------------------------------------------\n");
  }

  // 3. Check Lighthouse CI Results (if .lighthouseci/ manifests exist)
  const lhciDir = path.join(process.cwd(), ".lighthouseci");
  const manifestFile = path.join(lhciDir, "manifest.json");

  if (fs.existsSync(manifestFile)) {
    try {
      const runs = JSON.parse(fs.readFileSync(manifestFile, "utf-8"));
      console.log("📊 Lighthouse Mobile Audit Results Summary:");
      console.log("------------------------------------------------------------------------------------------------");
      console.log(
        `${padRight("Audited Route", 30)} | ${padLeft("Perf", 6)} | ${padLeft("A11y", 6)} | ${padLeft("LCP (ms)", 10)} | ${padLeft("CLS", 7)} | ${padLeft("TBT (ms)", 10)} | ${padLeft("Status", 8)}`
      );
      console.log("------------------------------------------------------------------------------------------------");

      const th = budget.lighthouse.thresholds;

      for (const run of runs) {
        const jsonPath = run.jsonPath;
        if (jsonPath && fs.existsSync(jsonPath)) {
          const report = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
          const perf = Math.round((report.categories?.performance?.score || 0) * 100);
          const a11y = Math.round((report.categories?.accessibility?.score || 0) * 100);
          const lcp = Math.round(report.audits?.["largest-contentful-paint"]?.numericValue || 0);
          const cls = parseFloat((report.audits?.["cumulative-layout-shift"]?.numericValue || 0).toFixed(3));
          const tbt = Math.round(report.audits?.["total-blocking-time"]?.numericValue || 0);

          const perfPass = perf >= th.performance;
          const a11yPass = a11y >= th.accessibility;
          const lcpPass = lcp <= th.lcpMs;
          const clsPass = cls <= th.cls;
          const tbtPass = tbt <= th.tbtMs;

          const allPass = perfPass && a11yPass && lcpPass && clsPass && tbtPass;
          if (!allPass) hasFailure = true;

          const urlObj = new URL(run.url);
          const routeLabel = urlObj.pathname === "" ? "/" : urlObj.pathname;

          console.log(
            `${padRight(routeLabel.slice(0, 28), 30)} | ${padLeft(`${perf}`, 6)} | ${padLeft(`${a11y}`, 6)} | ${padLeft(`${lcp}ms`, 10)} | ${padLeft(`${cls}`, 7)} | ${padLeft(`${tbt}ms`, 10)} | ${padLeft(allPass ? "✅ PASS" : "❌ FAIL", 8)}`
          );
        }
      }
      console.log("------------------------------------------------------------------------------------------------\n");
    } catch (e) {
      console.warn("⚠️  Could not parse .lighthouseci/manifest.json:", e);
    }
  }

  if (hasFailure) {
    console.error("❌ Performance guardrail violations detected! Build rejected.");
    return false;
  }

  console.log("✅ All performance budgets and guardrails passed cleanly!\n");
  return true;
}

if (require.main === module) {
  const success = checkPerfBudgets();
  process.exit(success ? 0 : 1);
}
