const fs = require('fs');
const path = require('path');
const http = require('http');

const BANNED_TERMS = [
  'transfermarkt',
  'fotmob',
  'tm.',
  'transfermarkt.technology',
  'fotmob.com',
  'scraper',
  'scraped',
  'edge scrapers'
];

const THIRD_PARTY_IMAGE_HOSTS = [
  'transfermarkt.technology',
  'tmssl.akamaized.net',
  'fotmob.com',
  'api-sports.io'
];

function scanDirectory(dir, filterExt = ['.js', '.html', '.css', '.json']) {
  let hits = [];
  if (!fs.existsSync(dir)) return hits;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      hits = hits.concat(scanDirectory(fullPath, filterExt));
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.map')) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (filterExt.length > 0 && !filterExt.includes(ext)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      for (const term of BANNED_TERMS) {
        // match case-insensitively
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        let m;
        while ((m = regex.exec(content)) !== null) {
          hits.push({
            file: fullPath,
            term,
            matched: m[0],
            snippet: content.substring(Math.max(0, m.index - 30), Math.min(content.length, m.index + term.length + 30)).replace(/\s+/g, ' ')
          });
        }
      }
    }
  }
  return hits;
}

console.log('--- 1. SCANNING CLIENT BUILD OUTPUT (.next/static) ---');
const staticHits = scanDirectory(path.join(__dirname, '..', '.next', 'static'));
console.log(`Scanned .next/static. Total hits: ${staticHits.length}`);
if (staticHits.length > 0) {
  console.log('Hits in static client bundles:');
  staticHits.slice(0, 30).forEach(h => {
    console.log(`  [${h.term}] in ${path.relative(process.cwd(), h.file)}: "...${h.snippet}..."`);
  });
}

module.exports = { scanDirectory, BANNED_TERMS, THIRD_PARTY_IMAGE_HOSTS };
