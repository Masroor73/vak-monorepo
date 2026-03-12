import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Shift } from "@vak/contract";
import { getShiftsQueryKey } from "./shiftsKeys";

async function fetchShiftsForUser(userId: string): Promise<Shift[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("employee_id", userId)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Shift[];
}

/**
 * Fetches shifts for the current user from Supabase.
 * Query key: ['shifts', userId] so realtime INSERT invalidation refreshes this list.
 * RLS on the shifts table should restrict rows to the authenticated user's shifts.
 */
export function useShifts(userId: string | undefined) {
  const queryKey = getShiftsQueryKey(userId);

  return useQuery({
    queryKey,
    queryFn: () => fetchShiftsForUser(userId!),
    enabled: !!userId,
  });
}
