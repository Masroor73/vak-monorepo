import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function initSupabase(url: string, anonKey: string) {
  supabase = createClient(url, anonKey);
}

export function getSupabase() {
  if (!supabase) {
    throw new Error("Supabase not initialized. Call initSupabase first.");
  }
  return supabase;
}
