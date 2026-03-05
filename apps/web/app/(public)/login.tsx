import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@vak/contract";
import { supabase } from "../../lib/supabase";


export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [authError, setAuthError]       = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  // ── Auto-clear errors after 15s ──────────────────────────────────────────
  useEffect(() => {
    if (!authError && Object.keys(errors).length === 0) return;
    const t = setTimeout(() => {
      clearErrors();
      setAuthError("");
    }, 15000);
    return () => clearTimeout(t);
  }, [authError, errors]);

  // ── Clear errors when leaving the screen ─────────────────────────────────
  useEffect(() => {
    return () => {
      clearErrors();
      setAuthError("");
    };
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onLogin = async (data: LoginInput) => {
    setLoading(true);
    setAuthError("");

    const { data: authData, error: authSignInError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authSignInError) {
      setAuthError("Invalid email or password.");
      setLoading(false);
      return;
    }

    // ── Remember me ────────────────────────────────────────────────────────
    // Supabase persists sessions in localStorage by default.
    // If rememberMe is false, we store a flag so we can clear
    // the session when the browser is reopened.
    if (!rememberMe) {
      sessionStorage.setItem("vak_session_temp", "true");
    } else {
      sessionStorage.removeItem("vak_session_temp");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setAuthError("Could not verify your account. Please try again.");
      setLoading(false);
      return;
    }

    const isManager = profile.role === "MANAGER" || profile.role === "OWNER";
    if (!isManager) {
      await supabase.auth.signOut();
      setAuthError("Access denied. This portal is for managers only.");
      setLoading(false);
      return;
    }

    router.replace("/(tabs)");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-auth-bg flex justify-center items-center px-4 py-10">
      <div className="flex w-full max-w-4xl border border-auth-border shadow-2xl flex-col md:flex-row">

        {/* ── LEFT PANEL ── */}
        <div className="flex-col w-full md:w-[45%] bg-auth-panel border-r border-auth-border px-10 py-12">

          {/* Brand */}
          <p className="text-xl font-black tracking-[0.22em] text-auth-white mb-6">
            V<span className="text-auth-blue">.</span>
            A<span className="text-auth-blue">.</span>
            K
          </p>

          {/* Heading */}
          <h1 className="text-[28px] font-black text-auth-textPrimary mb-1">
            Welcome back.
          </h1>
          <p className="text-[13px] text-auth-textSecondary mb-6">
            Sign in to your portal.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-auth-divider" />
            <span className="text-[10px] text-auth-textSecondary uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-auth-divider" />
          </div>

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <div className="mb-3">
                <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-auth-textSecondary mb-2">
                  Email Address
                </label>
                <input
                  type="text"
                  placeholder="Enter email"
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    if (authError) setAuthError("");
                  }}
                  className={`w-full bg-auth-input border text-auth-textPrimary text-l px-4 py-3 outline-none focus:border-auth-borderFocus transition-colors placeholder-auth-textMuted ${
                    errors.email ? "border-red-500/60" : "border-auth-borderMid"
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-400 mt-1">
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
              <div className="mb-2">
                <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-auth-textSecondary mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      if (authError) setAuthError("");
                    }}
                    className={`w-full bg-auth-input border text-auth-textPrimary text-sm px-4 py-3 pr-14 outline-none focus:border-auth-borderFocus transition-colors placeholder-auth-textMuted ${
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
                {errors.password && (
                  <p className="text-sm text-red-400 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Auth error banner */}
          {authError && (
            <div className="flex items-start justify-between border border-red-500/30 bg-red-500/10 px-3 py-2 mt-2">
              <p className="text-[11px] text-red-400">{authError}</p>
              <button
                type="button"
                onClick={() => setAuthError("")}
                className="text-red-400/60 hover:text-red-400 text-[10px] ml-3 leading-none"
              >
                ✕
              </button>
            </div>
          )}

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between mt-4 mb-6">
            <label className="flex items-center gap-2 text-[12px] text-auth-textSecondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="w-3.5 h-3.5 accent-auth-blue bg-auth-input border border-auth-borderMid cursor-pointer"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => router.push("/(public)/forgotPassword")}
              className="text-[12px] text-white font-semibold underline underline-offset-2 hover:text-auth-blueHover transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleSubmit(onLogin)}
            disabled={loading}
            className="w-full bg-auth-blue hover:bg-auth-blueHover disabled:opacity-50 disabled:cursor-not-allowed text-auth-white text-[11px] font-black tracking-[0.2em] uppercase py-3.5 transition-all shadow-lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="hidden md:flex flex-1 bg-auth-bg relative items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(#1e2333 1px, transparent 1px), linear-gradient(90deg, #1e2333 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          
          <div className="absolute top-0 left-0 w-72 h-72 bg-auth-blue/5" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-auth-blue/5" />
          <div className="absolute top-5 left-5 w-14 h-14 border-t-4 border-l-4 border-auth-blue" />
          <div className="absolute bottom-5 right-5 w-14 h-14 border-b-4 border-r-4 border-auth-blue" />
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-auth-green" />
            <span className="text-[12px] uppercase text-auth-textMuted font-semibold">
              System Online
            </span>
          </div>
          <div className="relative z-10 text-center">
            <p className="font-black text-auth-white mb-5 text-[92px]">
              V<span className="text-auth-blue">.</span>
              A<span className="text-auth-blue">.</span>
              K
            </p>
            <div className="w-24 h-2 bg-auth-blue mx-auto mb-5" />
            <p className="text-[18px] tracking-[0.3em] uppercase text-auth-textSecondary font-bold mb-3">
              Employee Management System
            </p>
            <p className="text-[18px] text-auth-textSecondary max-w-[300px] mx-auto leading-relaxed">
              Centralized workforce operations for modern organizations.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}