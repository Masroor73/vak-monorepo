import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Remember Me ON — saves session to phone storage
export const supabasePersistent = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Remember Me OFF — session only lives in memory
export const supabaseTemporary = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: undefined,
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Active client — starts as temporary (safe default)
export let supabase: SupabaseClient = supabaseTemporary;

export function setSupabaseClient(rememberMe: boolean) {
  supabase = rememberMe ? supabasePersistent : supabaseTemporary;
}