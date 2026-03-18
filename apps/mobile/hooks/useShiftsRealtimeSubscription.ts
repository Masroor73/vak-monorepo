import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";
import { persistentClient } from '../lib/supabase';
import { SHIFTS_QUERY_KEY_BASE } from "./shiftsKeys";

const __DEV__ = process.env.NODE_ENV !== "production";

/**
 * Subscribes to Supabase Realtime INSERT events on the `shifts` table.
 * On INSERT, invalidates all shifts-related queries so the UI refetches and shows the new shift.
 *
 * Why invalidation: We don't know if the new row belongs to the current user/org until we refetch
 * (RLS and our useShifts(userId) filter handle that). Invalidation is the safest and simplest approach.
 *
 * Query keys invalidated: all keys starting with ['shifts'] (see shiftsKeys.ts).
 * Mount this once per app session (e.g. in tabs layout) to avoid duplicate subscriptions.
 */
export function useShiftsRealtimeSubscription() {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = persistentClient
      .channel("shifts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shifts" },
        (payload) => {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log("[Shifts Realtime] INSERT", payload.new?.id ?? payload);
          }
          // Invalidate all shifts queries so list/schedule refetch. Exact: false matches
          // ['shifts'], ['shifts', userId], and any future shifts-related keys.
          queryClient.invalidateQueries({
            queryKey: SHIFTS_QUERY_KEY_BASE,
            exact: false,
          });
        }
      )
      .subscribe((status) => {
        if (__DEV__ && status === "SUBSCRIBED") {
          // eslint-disable-next-line no-console
          console.log("[Shifts Realtime] Channel subscribed");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        persistentClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
}
