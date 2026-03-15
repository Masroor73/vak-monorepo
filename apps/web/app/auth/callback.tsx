import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/(public)/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, is_approved")
        .eq("id", session.user.id)
        .single();

      if (error || !profile) {
        await supabase.auth.signOut();
        router.replace("/(public)/login");
        return;
      }

      const isManager = profile.role === "MANAGER" || profile.role === "OWNER";
      if (!isManager) {
        await supabase.auth.signOut();
        router.replace("/(public)/login");
        return;
      }

      if (!profile.is_approved) {
        router.replace("/(public)/pendingApproval");
        return;
      }

      router.replace("/(tabs)");
    });
  }, []);

  return (
    <div className="min-h-screen bg-auth-bg flex items-center justify-center">
      <p className="text-auth-textSecondary text-sm tracking-widest uppercase">
        Signing you in...
      </p>
    </div>
  );
}