import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema, SignupInput, PASSWORD_RULES } from "@vak/contract";
import { supabase } from "../../lib/supabase";
import Google from "../../assets/Google.svg";

function PasswordRequirements({ password }: { password: string }) {
  return (
    <div className="border border-auth-borderMid bg-auth-card px-3 py-2 mt-1 mb-1">
      <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-auth-textSecondary mb-1.5">
        Password requirements
      </p>
      <ul className="space-y-0.5">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-2">
              <span className={`text-[10px] font-bold ${met ? "text-auth-green" : "text-auth-textMuted"}`}>
                {met ? "✓" : "○"}
              </span>
              <span className={`text-[10px] ${met ? "text-auth-green" : "text-auth-textMuted"}`}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { full_name: "", email: "", password: "", confirmPassword: "" },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });


  useEffect(() => {
    if (!authError && Object.keys(errors).length === 0) return;
    const t = setTimeout(() => { clearErrors(); setAuthError(""); }, 15000);
    return () => clearTimeout(t);
  }, [authError, errors]);

  useEffect(() => {
    return () => { clearErrors(); setAuthError(""); };
  }, []);

  const onSignUp = async (data: SignupInput) => {
    setLoading(true);
    setAuthError("");

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } },
    });

    if (error) {
      setAuthError(error.message ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    router.replace("/(public)/pendingApproval");
    setLoading(false);
  };

  return (
    <div className="bg-auth-bg min-h-screen w-full flex items-center justify-center px-4 py-6">
      <div
        className="flex w-full border border-auth-border shadow-2xl flex-col md:flex-row"
        style={{ maxWidth: "860px", margin: "0 auto" }}
      >

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col w-full md:w-[45%] bg-auth-panel border-r border-auth-border px-8 py-8">

          {/* Brand */}
          <p className="text-lg font-black tracking-[0.22em] text-auth-white mb-4">
            V<span className="text-auth-blue">.</span>
            A<span className="text-auth-blue">.</span>
            K
          </p>

          {/* Heading */}
          <h1 className="text-[22px] font-black text-auth-textPrimary leading-tight mb-0.5">
            Create account.
          </h1>
          <p className="text-[12px] text-auth-textSecondary mb-4">
            Join your team on the V.A.K portal.
          </p>

          {/* Google SSO */}
          <button className="w-full flex items-center justify-center gap-3 bg-auth-card border border-auth-borderMid text-auth-textPrimary text-[11px] font-semibold tracking-wide py-2.5 mb-3 hover:border-auth-borderFocus hover:text-auth-blue transition-all">
            <Google width={16} height={16} />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-auth-divider" />
            <span className="text-[10px] text-auth-textSecondary uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-auth-divider" />
          </div>

          {/* Full Name */}
          <Controller
            control={control}
            name="full_name"
            render={({ field }) => (
              <div className="mb-2.5">
                <label className="block text-[9px] font-bold tracking-[0.18em] uppercase text-auth-textSecondary mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={field.value}
                  onChange={(e) => { field.onChange(e); if (authError) setAuthError(""); }}
                  className={`w-full bg-auth-input border text-auth-textPrimary text-[13px] px-3 py-2.5 outline-none focus:border-auth-borderFocus transition-colors placeholder-auth-textMuted ${
                    errors.full_name ? "border-red-500/60" : "border-auth-borderMid"
                  }`}
                />
                {errors.full_name && (
                  <p className="text-[10px] text-red-400 mt-0.5">{errors.full_name.message}</p>
                )}
              </div>
            )}
          />

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <div className="mb-2.5">
                <label className="block text-[9px] font-bold tracking-[0.18em] uppercase text-auth-textSecondary mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={field.value}
                  onChange={(e) => { field.onChange(e); if (authError) setAuthError(""); }}
                  className={`w-full bg-auth-input border text-auth-textPrimary text-[13px] px-3 py-2.5 outline-none focus:border-auth-borderFocus transition-colors placeholder-auth-textMuted ${
                    errors.email ? "border-red-500/60" : "border-auth-borderMid"
                  }`}
                />
                {errors.email && (
                  <p className="text-[10px] text-red-400 mt-0.5">
                    {errors.email.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <div className="mb-2.5">
                <label className="block text-[9px] font-bold tracking-[0.18em] uppercase text-auth-textSecondary mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={field.value}
                    onChange={(e) => { field.onChange(e); if (authError) setAuthError(""); }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`w-full bg-auth-input border text-auth-textPrimary text-[13px] px-3 py-2.5 pr-14 outline-none focus:border-auth-borderFocus transition-colors placeholder-auth-textMuted ${
                      errors.password ? "border-red-500/60" : "border-auth-borderMid"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-[0.15em] uppercase text-auth-textMuted hover:text-auth-white transition-colors"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
                {passwordFocused && <PasswordRequirements password={field.value} />}
                {errors.password && (
                  <p className="text-[10px] text-red-400 mt-0.5">{errors.password.message}</p>
                )}
              </div>
            )}
          />

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <div className="mb-2.5">
                <label className="block text-[9px] font-bold tracking-[0.18em] uppercase text-auth-textSecondary mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    value={field.value}
                    onChange={(e) => { field.onChange(e); if (authError) setAuthError(""); }}
                    className={`w-full bg-auth-input border text-auth-textPrimary text-[13px] px-3 py-2.5 pr-14 outline-none focus:border-auth-borderFocus transition-colors placeholder-auth-textMuted ${
                      errors.confirmPassword ? "border-red-500/60" : "border-auth-borderMid"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-[0.15em] uppercase text-auth-textMuted hover:text-auth-white transition-colors"
                  >
                    {showConfirm ? "HIDE" : "SHOW"}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] text-red-400 mt-0.5">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}
          />

          {/* Auth error banner */}
          {authError && (
            <div className="flex items-start justify-between border border-red-500/30 bg-red-500/10 px-3 py-2 mt-1.5 mb-1.5">
              <p className="text-[10px] text-red-400">{authError}</p>
              <button
                type="button"
                onClick={() => setAuthError("")}
                className="text-red-400/60 hover:text-red-400 text-[10px] ml-3 leading-none mt-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={handleSubmit(onSignUp)}
            disabled={loading}
            className="w-full bg-auth-blue hover:bg-auth-blueHover disabled:opacity-50 disabled:cursor-not-allowed text-auth-white text-[11px] font-black tracking-[0.2em] uppercase py-3 mt-3 transition-all shadow-lg"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-[11px] text-auth-textSecondary mt-2.5">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/(public)/login")}
              className="text-auth-white font-bold hover:text-auth-blue transition-colors"
            >
              Sign in
            </button>
          </p>

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
          <div className="absolute top-0 left-0 w-80 h-80 bg-auth-blue/5" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-auth-blue/5" />
          <div className="absolute top-5 left-5 w-10 h-10 border-t-4 border-l-4 border-auth-blue" />
          <div className="absolute bottom-5 right-5 w-10 h-10 border-b-4 border-r-4 border-auth-blue" />
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-auth-green" />
            <span className="text-[11px] uppercase text-auth-textMuted font-semibold">
              System Online
            </span>
          </div>
          <div className="relative z-10 text-center">
            <p className="font-black text-auth-white mb-4 text-[72px] leading-none">
              V<span className="text-auth-blue">.</span>
              A<span className="text-auth-blue">.</span>
              K
            </p>
            <div className="w-20 h-1.5 bg-auth-blue mx-auto mb-4" />
            <p className="text-[14px] tracking-[0.3em] uppercase text-auth-textSecondary font-bold mb-2">
              Employee Management System
            </p>
            <p className="text-[14px] text-auth-textSecondary max-w-[260px] mx-auto leading-relaxed">
              You've been invited to join the V.A.K workforce platform.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
