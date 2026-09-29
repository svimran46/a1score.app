const fs = require('fs');

const hits = JSON.parse(fs.readFileSync('hits_audit.json', 'utf8'));
const srcHits = hits.filter(h => !h.file.endsWith('.csv') && h.file !== 'data-validation-report.json' && h.file !== 'tsconfig.tsbuildinfo');

const grouped = {};
for (const h of srcHits) {
  if (!grouped[h.file]) grouped[h.file] = [];
  grouped[h.file].push(h);
}

let out = `# THIRD-PARTY SOURCE AUDIT HITS\nTotal files: ${Object.keys(grouped).length} | Total non-CSV hits: ${srcHits.length}\n\n`;

for (const [file, items] of Object.entries(grouped)) {
  out += `### ${file} (${items.length} hits)\n`;
  for (const item of items) {
    out += `- **L${item.line}**: \`${item.text.replace(/`/g, "'")}\`\n`;
  }
  out += `\n`;
}

fs.writeFileSync('AUDIT_HITS_SUMMARY.md', out);
console.log('Saved AUDIT_HITS_SUMMARY.md');
