/**
 * Query keys for shifts data.
 * Used by useShifts and invalidated by useShiftsRealtimeSubscription on INSERT.
 * Keep in sync: any hook that fetches shifts should use a key that starts with SHIFTS_QUERY_KEY_BASE
 * so that invalidateQueries({ queryKey: SHIFTS_QUERY_KEY_BASE, exact: false }) refreshes all shift lists.
 */
export const SHIFTS_QUERY_KEY_BASE = ["shifts"] as const;

export function getShiftsQueryKey(userId: string | undefined) {
  if (!userId) return [...SHIFTS_QUERY_KEY_BASE] as const;
  return [...SHIFTS_QUERY_KEY_BASE, userId] as const;
}
