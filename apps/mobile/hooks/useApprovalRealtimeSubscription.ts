import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { createSupabaseClient } from "../lib/supabase";

const __DEV__ = process.env.NODE_ENV !== "production";
const POLL_INTERVAL_MS = 15000;

const persistentClient = createSupabaseClient(true);

export function useApprovalRealtimeSubscription() {
  const { user } = useAuth();
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkApproval = async () => {
      const { data, error } = await persistentClient
        .from("profiles")
        .select("is_approved")
        .eq("id", user.id)
        .single();

      if (__DEV__) {
        console.log("[Approval Poll] checked:", data?.is_approved, error?.message);
      }

      if (!error && data?.is_approved === true) {
        if (__DEV__) console.log("[Approval Poll] Approved! Redirecting...");
        clearInterval(intervalRef.current!);
        router.replace("/(tabs)");
      }
    };

    checkApproval();
    intervalRef.current = setInterval(checkApproval, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user]);
}