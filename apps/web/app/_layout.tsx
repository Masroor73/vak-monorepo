import "../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { initSupabase } from "@vak/api";
import { useEffect, useMemo } from "react";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function RootLayout() {
  useAuthGuard();
  useEffect(() => {
    initSupabase(
      process.env.EXPO_PUBLIC_SUPABASE_URL as string,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }, []);

  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
       <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}