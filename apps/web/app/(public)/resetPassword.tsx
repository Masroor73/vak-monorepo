import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [sessionEstablished, setSessionEstablished] = useState(false);

  useEffect(() => {
    // 1. Setup auth listener and capture the subscription for cleanup
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionEstablished(true);
      }
    });

    // 2. Manual Fallback Verification
    const verifyToken = async () => {
      const token_hash = params.token as string;
      const type = params.type as string;

      if (token_hash && type === 'recovery' && !sessionEstablished) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery'
        });
        
        if (error) {
          setMessage({ text: "Recovery link is invalid or has expired.", type: "error" });
        } else {
          setSessionEstablished(true);
          setMessage({ text: "Link verified. Please enter your new password.", type: "success" });
        }
      }
    };

    verifyToken();

    // 3. Cleanup function to prevent memory leaks
    return () => {
      data.subscription.unsubscribe();
    };
  }, [params, sessionEstablished]);

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }
    
    if (!sessionEstablished) {
      setMessage({ text: "Auth session missing! Please click the link in your email again.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ text: "Password updated successfully! Redirecting to login...", type: "success" });
      setTimeout(() => {
        router.replace("/(public)/login");
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-auth-bg flex items-center justify-center">
      <div className="flex w-full max-w-4xl h-[580px] border border-auth-border overflow-hidden shadow-2xl">
        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col w-5/12 bg-auth-panel border-r border-auth-border px-10 py-12">
          <p className="text-xl font-black tracking-[0.22em] text-auth-white mb-10">
            V<span className="text-auth-blue">.</span>
            A<span className="text-auth-pending">.</span>
            K
          </p>

          <h1 className="text-[28px] font-black text-auth-textPrimary leading-tight mb-1">
            Create new<br />password.
          </h1>
          <p className="text-[13px] text-auth-textSecondary font-light mb-8">
            Your new password must be different from previously used passwords.
          </p>

          {/* New Password */}
          <div className="mb-4 relative">
            <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-auth-textSecondary mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-auth-input border border-auth-borderMid text-auth-textPrimary text-sm px-4 py-3 pr-14 outline-none focus:border-auth-borderFocus transition-colors placeholder-auth-textMuted"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-[0.15em] uppercase text-auth-textMuted hover:text-auth-white transition-colors"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4 relative">
            <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-auth-textSecondary mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-auth-input border border-auth-borderMid text-auth-textPrimary text-sm px-4 py-3 pr-14 outline-none focus:border-auth-borderFocus transition-colors placeholder-auth-textMuted"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-[0.15em] uppercase text-auth-textMuted hover:text-auth-white transition-colors"
              >
                {showConfirm ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-4 px-3 py-2 text-[11px] font-semibold border ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
              {message.text}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleUpdatePassword}
            disabled={loading || !sessionEstablished}
            className="w-full bg-auth-blue hover:bg-auth-blueHover disabled:opacity-50 text-auth-white text-[11px] font-black tracking-[0.2em] py-3.5 transition-all shadow-lg mt-2"
          >
            {loading ? "SAVING..." : "RESET PASSWORD"}
          </button>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 bg-auth-bg relative flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(#1e2333 1px, transparent 1px), linear-gradient(90deg, #1e2333 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          <div className="absolute top-0 left-0 w-72 h-72 bg-auth-blue/5" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-auth-blue/5" />
          <div className="absolute top-5 left-5 w-14 h-14 border-t-4 border-l-4 border-auth-blue" />
          <div className="absolute bottom-5 right-5 w-14 h-14 border-b-4 border-r-4 border-auth-blue" />
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-auth-green" />
            <span className="text-[12px] uppercase text-auth-textMuted font-semibold">System Online</span>
          </div>

          <div className="relative z-10 text-center">
            <p className="font-black text-auth-white mb-5 text-[92px]">
              V<span className="text-auth-blue">.</span>
              A<span className="text-auth-pending">.</span>
              K
            </p>
            <div className="w-24 h-2 bg-auth-blue mx-auto mb-5" />
            <p className="text-[18px] tracking-[0.3em] uppercase text-auth-textSecondary font-bold mb-3">
              Workforce Management System
            </p>
            <p className="text-[18px] text-auth-textSecondary max-w-[300px] mx-auto leading-relaxed">
              We'll help you get back in securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}