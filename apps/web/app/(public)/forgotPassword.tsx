import { useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleReset = async () => {
    if (!email) {
      setMessage({ text: "Please enter your email address.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);

    // Dynamically construct the redirect URL based on the current environment
    // This works on localhost during dev AND on Vercel during production
    const redirectUrl = `${window.location.origin}/(public)/resetPassword`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ text: "Check your email for the password reset link.", type: "success" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-auth-bg flex items-center justify-center">
      <div className="flex w-full max-w-4xl h-[580px] border border-auth-border overflow-hidden shadow-2xl">

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col w-5/12 bg-auth-panel border-r border-auth-border px-10 py-12 relative">
          <p className="text-xl font-black tracking-[0.22em] text-auth-white mb-10">
            V<span className="text-auth-blue">.</span>
            A<span className="text-auth-pending">.</span>
            K
          </p>

          <h1 className="text-[28px] font-black text-auth-textPrimary leading-tight mb-1">
            Forgot your<br />password?
          </h1>
          <p className="text-[13px] text-auth-textSecondary font-light mb-8">
            Enter your work email and we'll send you a verification code.
          </p>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-auth-textSecondary mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@vak.com"
              className="w-full bg-auth-input border border-auth-borderMid text-auth-textPrimary text-sm px-4 py-3 outline-none focus:border-auth-borderFocus transition-colors placeholder-auth-textMuted"
            />
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-4 px-3 py-2 text-[11px] font-semibold border ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
              {message.text}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-auth-blue hover:bg-auth-blueHover disabled:opacity-50 text-auth-white text-[11px] font-black tracking-[0.2em] py-3.5 transition-all shadow-lg mt-2"
          >
            {loading ? "SENDING..." : "SEND LINK"}
          </button>

          <p className="text-[12px] text-auth-textSecondary text-center mt-6">
            Remembered it?{" "}
            <button
              onClick={() => router.back()}
              className="text-auth-white font-bold underline underline-offset-2 hover:text-auth-blue transition-colors"
            >
              Back to sign in
            </button>
          </p>
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