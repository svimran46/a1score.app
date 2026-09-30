import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL or DIRECT_URL environment variable.");
  process.exit(1);
}

async function main() {
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const res = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  const tables: Record<string, string[]> = {};
  for (const r of res.rows) {
    if (!tables[r.table_name]) tables[r.table_name] = [];
    tables[r.table_name].push(`${r.column_name} (${r.data_type}${r.is_nullable === 'NO' ? ' NOT NULL' : ''}${r.column_default ? ' DEFAULT ' + r.column_default : ''})`);
  }

  for (const [tbl, cols] of Object.entries(tables)) {
    console.log(`\nTable: "${tbl}"`);
    for (const c of cols) {
      console.log(`  - ${c}`);
    }
  }

  await client.end();
}

main().catch(console.error);
