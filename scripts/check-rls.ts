import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in environment to run check-rls.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

const TABLES = [
  "Club",
  "Player",
  "League",
  "Transfer",
  "MarketValueHistory",
  "SeasonStats",
  "Injury",
] as const;

async function checkTableRls(tableName: string): Promise<boolean> {
  let isSecure = true;
  console.log(`\n🔍 Checking RLS permissions on table "${tableName}" using Anon key...`);

  // 1. Probe INSERT
  try {
    const insertPayload: Record<string, any> = {
      id: `__probe_rls_${Date.now()}__`,
    };
    if (tableName === "Player") {
      insertPayload.fullName = "RLS Probe";
      insertPayload.position = "Forward";
    } else if (tableName === "Club") {
      insertPayload.name = "RLS Probe FC";
    } else if (tableName === "League") {
      insertPayload.name = "RLS Probe League";
      insertPayload.country = "Probe";
    } else if (tableName === "Transfer") {
      insertPayload.playerId = "cmuih00000000000000000000";
      insertPayload.date = new Date().toISOString();
    } else if (tableName === "MarketValueHistory") {
      insertPayload.playerId = "cmuih00000000000000000000";
      insertPayload.date = new Date().toISOString();
      insertPayload.valueEur = 1000;
    } else if (tableName === "SeasonStats") {
      insertPayload.playerId = "cmuih00000000000000000000";
      insertPayload.season = "2026/2027";
      insertPayload.competition = "Probe";
      insertPayload.clubName = "Probe";
    } else if (tableName === "Injury") {
      insertPayload.playerId = "cmuih00000000000000000000";
      insertPayload.type = "Probe";
      insertPayload.startDate = new Date().toISOString();
    }

    const { data: insertData, error: insertError } = await supabase
      .from(tableName)
      .insert(insertPayload)
      .select();

    if (!insertError && insertData && insertData.length > 0) {
      console.error(`  ❌ VULNERABILITY: INSERT succeeded on "${tableName}". RLS write policy is not blocking writes!`);
      // Clean up the probe row
      await supabase.from(tableName).delete().eq("id", insertPayload.id);
      isSecure = false;
    } else {
      console.log(`  ✅ INSERT correctly denied: ${insertError?.message || "Policy violation"}`);
    }
  } catch (err: any) {
    console.log(`  ✅ INSERT denied with exception: ${err.message}`);
  }

  // 2. Probe UPDATE
  try {
    const { data: updateData, error: updateError } = await supabase
      .from(tableName)
      .update({ updatedAt: new Date().toISOString() })
      .eq("id", "__probe_nonexistent_id__")
      .select();

    if (!updateError && updateData && updateData.length > 0) {
      console.error(`  ❌ VULNERABILITY: UPDATE succeeded on "${tableName}"!`);
      isSecure = false;
    } else if (updateError) {
      console.log(`  ✅ UPDATE denied or restricted by policy: ${updateError.message}`);
    } else {
      console.log(`  ✅ UPDATE affected 0 rows (no write access permitted)`);
    }
  } catch (err: any) {
    console.log(`  ✅ UPDATE denied with exception: ${err.message}`);
  }

  // 3. Probe DELETE
  try {
    const { data: deleteData, error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq("id", "__probe_nonexistent_id__")
      .select();

    if (!deleteError && deleteData && deleteData.length > 0) {
      console.error(`  ❌ VULNERABILITY: DELETE succeeded on "${tableName}"!`);
      isSecure = false;
    } else if (deleteError) {
      console.log(`  ✅ DELETE denied or restricted by policy: ${deleteError.message}`);
    } else {
      console.log(`  ✅ DELETE affected 0 rows (no delete access permitted)`);
    }
  } catch (err: any) {
    console.log(`  ✅ DELETE denied with exception: ${err.message}`);
  }

  return isSecure;
}

async function main() {
  console.log("=== SUPABASE ROW LEVEL SECURITY (RLS) AUDIT ===");
  console.log(`Target Supabase URL: ${supabaseUrl}`);
  console.log(`Using Key: ${supabaseAnonKey.slice(0, 10)}...${supabaseAnonKey.slice(-5)}`);

  let allSecure = true;
  for (const table of TABLES) {
    const tableSecure = await checkTableRls(table);
    if (!tableSecure) {
      allSecure = false;
    }
  }

  console.log("\n===============================================");
  if (allSecure) {
    console.log("✅ ALL TABLES ENFORCE ROW LEVEL SECURITY SAFELY.");
    process.exit(0);
  } else {
    console.error("❌ CRITICAL: One or more tables permit unauthorized writes under the anon key.");
    console.error("Please apply the policies defined in docs/SUPABASE_RLS.md immediately.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error during RLS check:", err);
  process.exit(1);
});
