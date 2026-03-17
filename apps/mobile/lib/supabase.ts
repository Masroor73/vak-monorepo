import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const memoryStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

// default client (used everywhere, non-persistent)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,        // always false for default client
    autoRefreshToken: true,
    storage: memoryStorage,       // session only in memory
  },
});

// login client (only for sign-in)
export const createSupabaseClient = (rememberMe: boolean) => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: rememberMe,              // depends on checkbox
      autoRefreshToken: true,
      storage: rememberMe ? AsyncStorage : memoryStorage,
    },
  });
};