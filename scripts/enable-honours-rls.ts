import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

const connectionString = (process.env.DATABASE_URL || "").replace(/[?&]sslmode=[^&]*/, "");
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  console.log("Checking RLS on Competition and CompetitionWinner...");
  await pool.query(`
    ALTER TABLE "Competition" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "CompetitionWinner" ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'Competition' AND policyname = 'Public read-only Competition'
      ) THEN
        CREATE POLICY "Public read-only Competition" ON "Competition" FOR SELECT USING (true);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'CompetitionWinner' AND policyname = 'Public read-only CompetitionWinner'
      ) THEN
        CREATE POLICY "Public read-only CompetitionWinner" ON "CompetitionWinner" FOR SELECT USING (true);
      END IF;
    END
    $$;
  `);

  console.log("RLS policies enabled for Competition and CompetitionWinner!");
  await pool.end();
}

main().catch(console.error);
