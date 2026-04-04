import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { SHIFTS_QUERY_KEY_BASE } from "./shiftsKeys";

const __DEV__ = process.env.NODE_ENV !== "production";

/**
 * Subscribes to Supabase Realtime on the `shifts` table.
 * Listens for ALL change events (INSERT, UPDATE, DELETE) using event: "*", invalidates all shifts-related queries so the UI refetches and shows the new shift.
 *
 * Why invalidation: We don't know if the new row belongs to the current user/org until we refetch
 * (RLS and our useShifts(userId) filter handle that). Invalidation is the safest and simplest approach.
 *
 * This covers:
 * - New shifts assigned by a manager (INSERT)
 * - Shift swaps approved by a manager (UPDATE — employee_id changes)
 * - Shifts cancelled or modified (UPDATE / DELETE)
 * 
 * Query keys invalidated: all keys starting with ['shifts'] (see shiftsKeys.ts).
 * Mount this once per app session (e.g. in tabs layout) to avoid duplicate subscriptions.
 */
export function useShiftsRealtimeSubscription() {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("shifts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts" },
        (payload) => {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log("[Shifts Realtime]", payload.eventType, payload.eventType === "DELETE" ? payload.old?.id : payload.new?.id);
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
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
}
