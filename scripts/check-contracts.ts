import { supabase } from "../src/lib/supabase";

async function main() {
  const { data, error } = await supabase
    .from("Player")
    .select("id, fullName, contractUntil")
    .not("contractUntil", "is", null)
    .limit(5);

  console.log("Sample contractUntil:", data, "Error:", error);

  const { count: withContract } = await supabase
    .from("Player")
    .select("id", { count: "exact", head: true })
    .not("contractUntil", "is", null);

  const { count: totalPlayers } = await supabase
    .from("Player")
    .select("id", { count: "exact", head: true });

  console.log(`Contract count: ${withContract} / ${totalPlayers} (${(((withContract || 0) / (totalPlayers || 1)) * 100).toFixed(1)}%)`);
  process.exit(0);
}

main().catch(console.error);
