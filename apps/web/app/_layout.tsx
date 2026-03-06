import "../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initSupabase } from "@vak/api";
import { useEffect, useMemo } from "react";

export default function RootLayout() {
  useEffect(() => {
    initSupabase(
      process.env.EXPO_PUBLIC_SUPABASE_URL as string,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }, []);

  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}