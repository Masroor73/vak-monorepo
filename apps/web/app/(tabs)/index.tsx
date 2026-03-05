import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function IndexScreen() {
  const { profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(public)/login");
  };

  return (
    <div className="min-h-screen bg-auth-bg text-auth-textPrimary">
      <div className="border-b border-auth-border bg-auth-panel px-8 py-4 flex items-center justify-between">
        <p className="text-lg font-black tracking-[0.22em] text-auth-white">
          V<span className="text-auth-blue">.</span>
          A<span className="text-auth-blue">.</span>
          K
        </p>
        <div className="flex items-center gap-6">
          <button
            onClick={handleSignOut}
            className="text-[10px] font-bold tracking-[0.15em] uppercase text-auth-textMuted hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      <div className="px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[26px] font-black text-auth-textPrimary mb-1">
            Good morning,
          </h1>
          <p className="text-[13px] text-auth-textSecondary">
            Here's what's happening across your workforce today.
          </p>
        </div>
      </div>
    </div>
  );
}