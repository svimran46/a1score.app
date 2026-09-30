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
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured in production."
    );
  } else {
    console.warn(
      "[Supabase] Warning: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables. Please check your .env configuration."
    );
  }
}

// In local development or testing without credentials, provide non-empty values so the client can initialize
const validUrl = supabaseUrl || "https://placeholder-project.supabase.co";
const validKey = supabaseAnonKey || "placeholder-anon-key";

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: false,
  },
});
