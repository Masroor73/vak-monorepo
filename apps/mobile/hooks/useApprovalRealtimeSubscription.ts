import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

const __DEV__ = process.env.NODE_ENV !== "production";

/**
 * Subscribes to Supabase Realtime UPDATE events on the `profiles` table.
 * When the current user's `is_approved` flips to true, redirects to the main app instantly.
 *
 * Why filtered subscription: We only care about the current user's profile row,
 * so we filter by id=eq.userId to avoid processing other users' updates.
 *
 * Mount this once on the pending-approval screen so it cleans up on navigation away.
 */
export function useApprovalRealtimeSubscription() {
  const { user } = useAuth();
  const router = useRouter();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("approval")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (__DEV__) {
            console.log("[Approval Realtime] UPDATE", payload.new);
          }

          if (payload.new?.is_approved === true) {
            if (__DEV__) console.log("[Approval Realtime] Approved! Redirecting...");
            router.replace("/(tabs)");
          }
        }
      )
      .subscribe((status) => {
        if (__DEV__ && status === "SUBSCRIBED") {
          console.log("[Approval Realtime] Channel subscribed");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);
}