import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

interface AllowlistEntry {
  file: string;
  reason: string;
}

interface AllowlistConfig {
  entries: AllowlistEntry[];
}

const ALLOWLIST_PATH = path.resolve(process.cwd(), "tests/copy-claims-allowlist.json");
const allowlistConfig: AllowlistConfig = JSON.parse(
  fs.readFileSync(ALLOWLIST_PATH, "utf-8")
);

const allowlistFiles = new Set(
  allowlistConfig.entries.map((e) => e.file.replace(/\\/g, "/"))
);

// Forbidden user-facing phrases that constitute false or exaggerated claims
const FORBIDDEN_RULES: { name: string; pattern: RegExp; description: string }[] = [
  {
    name: "real-time",
    pattern: /\b(?:real-time|realtime)\b/i,
    description: "Do not claim 'real-time' or 'realtime' for matches or valuations.",
  },
  {
    name: "every 5s / 5s updates",
    pattern: /\b(?:every 5s|5s updates|live scores: 5s|updates: every 5s)\b/i,
    description: "Do not claim 5-second updates; client polls every 45s.",
  },
  {
    name: "live valuations",
    pattern: /\blive (?:market )?valuations?\b/i,
    description: "Valuations are periodic updates, never 'live valuations'.",
  },
  {
    name: "live updates badge",
    pattern: />\s*•?\s*Live Updates\s*</i,
    description: "Use 'Live (45s sync)' or explicit sync state instead of generic 'Live Updates'.",
  },
];

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".git" ||
        entry.name === "dist"
      ) {
        continue;
      }
      scanDirectory(fullPath, fileList);
    } else if (
      entry.isFile() &&
      /\.(tsx?|jsx?|md|json)$/.test(entry.name) &&
      !entry.name.endsWith(".d.ts")
    ) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

test("Copy Claims Audit: No forbidden real-time, every 5s, or live valuation claims in src/", () => {
  const srcDir = path.resolve(process.cwd(), "src");
  const files = scanDirectory(srcDir);
  const violations: { file: string; line: number; rule: string; snippet: string }[] = [];

  for (const filePath of files) {
    const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
    if (allowlistFiles.has(relPath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((lineText, idx) => {
      for (const rule of FORBIDDEN_RULES) {
        if (rule.pattern.test(lineText)) {
          violations.push({
            file: relPath,
            line: idx + 1,
            rule: rule.name,
            snippet: lineText.trim(),
          });
        }
      }
    });
  }

  if (violations.length > 0) {
    const details = violations
      .map((v) => `[${v.rule}] ${v.file}:${v.line} -> "${v.snippet}"`)
      .join("\n");
    assert.fail(
      `Found ${violations.length} forbidden copy claim violations in src/:\n${details}`
    );
  }

  assert.ok(true, "All src/ files comply with copy claims and data freshness policy.");
});
