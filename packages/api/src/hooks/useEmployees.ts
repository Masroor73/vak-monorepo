import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@vak/contract";
import { getSupabase } from "../supabase";

export function useEmployees() {
  const supabase = getSupabase();

  return useQuery<Profile[], Error>({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "EMPLOYEE")
        .order("full_name");

      if (error) throw new Error(error.message);

      return data ?? [];
    },
  });
}
