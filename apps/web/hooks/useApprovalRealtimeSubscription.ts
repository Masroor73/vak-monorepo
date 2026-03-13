//web/hooks/useApprovalRealtimeSubscription.ts
import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const __DEV__ = process.env.NODE_ENV !== "production";
<<<<<<< HEAD
const POLL_INTERVAL_MS = 3000;

/**
 * Polls the profiles table every 3 seconds to check if is_approved has changed.
=======
const POLL_INTERVAL_MS = 15000;

/**
 * Polls the profiles table every 15 seconds to check if is_approved has changed.
>>>>>>> origin/main
 * When is_approved flips to true, redirects the user to the dashboard.
 *
 * We use polling instead of realtime to avoid multiple Supabase client issues.
 * Mount this on the PendingApproval screen only.
 */
export function useApprovalRealtimeSubscription() {
  const { user } = useAuth();
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkApproval = async () => {
      const { data, error } = await supabase
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

    // check immediately on mount, then every 3 seconds
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