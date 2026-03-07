import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function initSupabase(url: string, anonKey: string) {
  if (!url || !anonKey) {
    throw new Error("Missing Supabase URL or ANON key for initSupabase()");
  }
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}

export function getSupabase() {
  if (!client) {
    throw new Error("Supabase not initialized. Call initSupabase first.");
  }
  return client;
}
