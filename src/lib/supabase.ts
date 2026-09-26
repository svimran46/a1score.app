import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://qqjpgehtutdmkkkxnefu.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxanBnZWh0dXRkbWtra3huZWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0Mjc5MzYsImV4cCI6MjEwNjAwMzkzNn0.x1mQJ8vDJ_cFkrpLBDe36kiHqb4ObKMzUlNkQNxTJsw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});
