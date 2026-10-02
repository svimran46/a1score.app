import fs from "fs";
import path from "path";

const DIRECTORIES_TO_SCAN = ["src/components", "src/app", "src/lib/og"];
const ALLOWED_EXTENSIONS = [".tsx", ".ts"];

// Canonical whitelist for Phase 16: src/lib/og/colors.ts is the ONLY file where hex is permitted.
const WHITELISTED_FILES = [path.normalize("src/lib/og/colors.ts")];

// Hex color regex: # followed by 3, 4, 6, or 8 hex digits, bounded by word boundary or quote
const HEX_REGEX = /#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

function getFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      if (ALLOWED_EXTENSIONS.some((ext) => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

function checkColors() {
  console.log("Checking for hardcoded hex colors in UI component files...");

  let totalViolations = 0;
  const files = DIRECTORIES_TO_SCAN.flatMap(getFiles);

  for (const filePath of files) {
    const normalized = path.normalize(filePath);
    if (WHITELISTED_FILES.some((w) => normalized.endsWith(w) || normalized === w)) {
      continue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, lineIndex) => {
      // Ignore comment lines or lines with eslint/color-ignore
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.includes("color-ignore")) {
        return;
      }

      // Ignore markdown headers like # or ## or anchor links href="#..."
      const cleaned = line.replace(/href=["']#[^"']*["']/g, "").replace(/["']#[^"']*["']/g, (match) => {
        // Only strip if not a hex color
        if (!HEX_REGEX.test(match)) return '""';
        return match;
      });

      const matches = cleaned.match(HEX_REGEX);
      if (matches) {
        matches.forEach((hex) => {
          console.error(
            `\x1b[31m[ERROR]\x1b[0m Hardcoded hex color ${hex} found in ${filePath}:${lineIndex + 1}`
          );
          console.error(`  Line: ${line.trim()}`);
          totalViolations++;
        });
      }
    });
  }

  if (totalViolations > 0) {
    console.error(
      `\n\x1b[31mFAILED:\x1b[0m Found ${totalViolations} hardcoded hex color(s) in component files. Please use design tokens from tokens.css.`
    );
    process.exit(1);
  } else {
    console.log(
      `\x1b[32mPASSED:\x1b[0m Zero hardcoded hex colors found across ${files.length} component files!`
    );
    process.exit(0);
  }
}

checkColors();
