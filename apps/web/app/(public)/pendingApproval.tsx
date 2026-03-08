import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(public)/login");
  };

  return (
    <div className="min-h-screen bg-auth-bg flex justify-center items-center px-4 py-10">
      <div className="flex w-full max-w-4xl border border-auth-border shadow-2xl flex-col md:flex-row">

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col w-full md:w-[45%] bg-auth-panel border-r border-auth-border px-8 py-8">

          {/* Brand */}
          <p className="text-lg font-black tracking-[0.22em] text-auth-white mb-5">
            V<span className="text-auth-blue">.</span>
            A<span className="text-auth-blue">.</span>
            K
          </p>

          {/* Icon */}
          <div className="w-12 h-12 border-2 border-auth-borderMid bg-auth-card flex items-center justify-center mb-5">
            <MaterialCommunityIcons name="account-clock-outline" size={22} color="#3B6FFF" />
          </div>

          {/* Heading */}
          <h1 className="text-[22px] font-black text-auth-textPrimary mb-1">
            Pending approval.
          </h1>
          <p className="text-[12px] text-auth-textSecondary mb-6">
            Your account has been created and is awaiting manager approval before you can access the portal.
          </p>

          {/* Status card */}
          <div className="border border-auth-borderMid bg-auth-card px-4 py-3 mb-6">
            <p className="text-[9px] font-bold uppercase text-auth-textSecondary mb-3">
              Account Status
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-auth-textSecondary">Registration</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-auth-green" />
                <span className="text-[11px] text-auth-green font-semibold">Complete</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-auth-textSecondary">Manager Approval</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-auth-pending animate-pulse" />
                <span className="text-[11px] text-auth-pending font-semibold">Pending</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-auth-textSecondary">Portal Access</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-auth-textMuted" />
                <span className="text-[11px] text-auth-textMuted font-semibold">Locked</span>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full bg-auth-blue hover:bg-auth-blueHover text-auth-white text-[11px] font-black tracking-[0.2em] uppercase py-3 transition-all shadow-lg"
          >
            Sign Out
          </button>

        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="hidden md:flex md:w-[55%] self-stretch bg-auth-bg relative items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(#1e2333 1px, transparent 1px), linear-gradient(90deg, #1e2333 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          <div className="absolute top-0 left-0 w-72 h-64 bg-auth-blue/5" />
          <div className="absolute bottom-0 right-0 w-72 h-64 bg-auth-blue/5" />
          <div className="absolute top-5 left-5 w-10 h-10 border-t-4 border-l-4 border-auth-blue" />
          <div className="absolute bottom-5 right-5 w-10 h-10 border-b-4 border-r-4 border-auth-blue" />
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-auth-pending animate-pulse" />
            <span className="text-[11px] uppercase text-auth-textMuted font-semibold">
              Awaiting Access
            </span>
          </div>
          <div className="relative z-10 text-center px-8">
            <p className="font-black text-auth-white mb-4 text-[72px]">
              V<span className="text-auth-blue">.</span>
              A<span className="text-auth-blue">.</span>
              K
            </p>
            <div className="w-20 h-1.5 bg-auth-blue mx-auto mb-4" />
            <p className="text-[14px] tracking-[0.3em] uppercase text-auth-textSecondary font-bold mb-2">
              Employee Management System
            </p>
            <p className="text-[14px] text-auth-textSecondary max-w-[260px] mx-auto leading-relaxed mb-6">
              Your request has been received. A manager will review and approve your access shortly.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-auth-green bg-auth-green/10 flex items-center justify-center">
                  <span className="text-[10px] text-auth-green font-black">✓</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-auth-textMuted">Register</span>
              </div>
              <div className="w-8 h-px bg-auth-borderMid mb-3" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-auth-pending bg-auth-pending/10 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-auth-pending animate-pulse" />
                </div>
                <span className="text-[9px] uppercase tracking-wider text-auth-textMuted">Approve</span>
              </div>
              <div className="w-8 h-px bg-auth-borderMid mb-3" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-auth-borderMid bg-auth-card flex items-center justify-center">
                  <span className="text-[10px] text-auth-textMuted font-black">→</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-auth-textMuted">Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}