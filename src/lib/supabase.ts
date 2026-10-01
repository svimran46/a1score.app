import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_SUPABASE_URL = "https://qqjpgehtutdmkkkxnefu.supabase.co";

function getCredentials() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  return { url, key };
}

let cachedClient: SupabaseClient | null = null;
let lastKey = "";
let lastUrl = "";

export function getSupabase(): SupabaseClient {
  const { url, key } = getCredentials();
  const validKey = key || "placeholder-anon-key";

  if (!cachedClient || lastKey !== validKey || lastUrl !== url) {
    cachedClient = createClient(url, validKey, {
      auth: {
        persistSession: false,
      },
    });
    lastKey = validKey;
    lastUrl = url;
  }

  return cachedClient;
}

// Transparent Proxy wrapper so existing calls like `supabase.from(...)` dynamically resolve the active client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

