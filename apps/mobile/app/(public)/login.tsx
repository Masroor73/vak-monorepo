// apps/mobile/app/(public)/login.tsx
import { useState, useEffect } from "react";
import { View, Alert, Pressable, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { TextField } from "@vak/ui";
import { useAuth } from "../../context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import Logo from "../../assets/Logo.svg";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput, SignupSchema, SignupInput } from "@vak/contract";
import EyeOpenIcon from "../../assets/eyeOpen.svg";
import EyeClosedIcon from "../../assets/eyeClosed.svg";
import Google from "../../assets/Google.svg";

// ─── Geometric shape primitives ───────────────────────────────────────────────
const Circle = ({ className }: { className: string }) => (
  <View className={`rounded-full absolute ${className}`} pointerEvents="none" />
);
const Ring = ({ className }: { className: string }) => (
  <View className={`rounded-full absolute bg-transparent border ${className}`} pointerEvents="none" />
);
const Diamond = ({ className }: { className: string }) => (
  <View className={`absolute rotate-45 ${className}`} pointerEvents="none" />
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const [showSignInPassword, setShowSignInPassword]   = useState(false);
  const [showSignUpPassword, setShowSignUpPassword]   = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { session, loading, signUp, login } = useAuth();
  const [isLoading, setIsLoading]   = useState(false);
  const [activeTab, setActiveTab]   = useState<"signin" | "signup">("signin");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const onForgotPassword = () => router.push("/(public)/forgetPassword");

  const signInForm = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });
  const signUpForm = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { email: "", password: "", full_name: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (activeTab === "signup") signUpForm.reset({ email: "", password: "", full_name: "", confirmPassword: "" });
    if (activeTab === "signin") { signInForm.reset({ email: "", password: "" }); setLoginError(null); }
  }, [activeTab]);

  const onSignUp = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.full_name);
      if (error) Alert.alert("Error", error.message);
      else Alert.alert("Success", "Please check your email to verify your account.", [
        { text: "OK", onPress: () => setActiveTab("signin") },
      ]);
    } catch { Alert.alert("Error", "Something went wrong. Please try again."); }
    finally { setIsLoading(false); }
  };

  const onLogin = async (data: LoginInput) => {
    setIsLoading(true); setLoginError(null);
    try {
      const { error } = await login(data.email, data.password);
      if (error === "INVALID_CREDENTIALS") { setLoginError("Invalid email or password"); return; }
      if (error === "ACCESS_DENIED")       { Alert.alert("Access Denied", "Only employees can access this app."); return; }
      if (error)                           { setLoginError("Something went wrong. Please try again."); return; }
      router.replace("/(tabs)");
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => { signInForm.clearErrors(); signUpForm.clearErrors(); setLoginError(null); }, 15000);
    return () => clearTimeout(t);
  }, [signInForm.formState.errors, signUpForm.formState.errors, loginError]);

  useEffect(() => {
    if (!loading && session) router.replace("/(tabs)");
  }, [session, loading]);

  return (
    <View className="flex-1 bg-brand-secondary">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <View className="bg-brand-secondary items-center overflow-hidden pt-14 pb-6">
        <Circle  className="w-52 h-52 bg-brand-secondaryLight -top-20 -right-16" />
        <Ring    className="w-36 h-36 border-brand-primary/25 top-2 -right-8" />
        <Diamond className="w-7  h-7  bg-brand-primary/30 top-16 right-16" />
        <Diamond className="w-6  h-6  bg-brand-primary/50 top-24 left-8" />

        {/* ── Single circle, larger logo ── */}
        <View className="z-10 items-center">
          <View className="w-36 h-36 rounded-full bg-brand-secondaryLight items-center justify-center mt-8 mb-5">
            <Logo width={110} height={100} />
          </View>
          <Text className="text-brand-primary text-[20px] font-extrabold tracking-[2px] uppercase">V.A.K</Text>
        </View>
      </View>

      {/* ── BOTTOM PANEL ─────────────────────────────────────────────────── */}
      <View className="flex-1 bg-brand-secondary overflow-hidden">
        <Circle className="w-40 h-40 bg-brand-primary/5 -bottom-16 -right-10" />
        <Circle className="w-24 h-24 bg-brand-secondaryLight/80 -bottom-1 -left-8" />

        {/* Tab Switcher */}
        <View className="flex-row mx-12 mb-6 bg-brand-secondary border-2 border-white/50 rounded-2xl p-1.5 z-10">
          <Pressable
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === "signin" ? "bg-brand-primary/80" : "bg-transparent"}`}
            onPress={() => setActiveTab("signin")}
          >
            <Text className={`text-sm font-semibold ${activeTab === "signin" ? "text-brand-secondary" : "text-white/70"}`}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === "signup" ? "bg-brand-primary/80" : "bg-transparent"}`}
            onPress={() => setActiveTab("signup")}
          >
            <Text className={`text-sm font-semibold ${activeTab === "signup" ? "text-brand-secondary" : "text-white/70"}`}>
              Sign Up
            </Text>
          </Pressable>
        </View>

        {/* Form Card */}
        <ScrollView
          className="flex-1 mx-5 z-10"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-brand-secondaryLight/80 rounded-3xl p-5 border border-white/10">

            {activeTab === "signin" ? (
              <>
                <Text className="text-white text-lg font-bold mb-1">Welcome back</Text>
                <Text className="text-white/40 text-xs mb-5">Sign in to clock in for your shift</Text>

                <Controller
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <TextField
                      variant="dark"
                      label="Email"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={field.value}
                      onChangeText={(text) => { field.onChange(text); if (loginError) setLoginError(null); }}
                      errorText={signInForm.formState.errors.email?.message}
                    />
                  )}
                />

                <Controller
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <>
                      <TextField
                        variant="dark"
                        label="Password"
                        placeholder="Enter your password"
                        secureTextEntry={!showSignInPassword}
                        value={field.value}
                        onChangeText={(text) => { field.onChange(text); if (loginError) setLoginError(null); }}
                        errorText={signInForm.formState.errors.password?.message}
                        rightElement={
                          <Pressable onPress={() => setShowSignInPassword(!showSignInPassword)}>
                            {showSignInPassword
                              ? <EyeOpenIcon width={22} height={22} />
                              : <EyeClosedIcon width={22} height={22} />}
                          </Pressable>
                        }
                      />
                      {loginError && (
                        <Text className="text-red-400 text-xs text-center -mt-2 mb-3">{loginError}</Text>
                      )}
                    </>
                  )}
                />

                {/* Remember me + Forgot password */}
                <View className="flex-row items-center justify-between mb-5 mt-1 mr-5">
                  <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} className="flex-row items-center">
                    <View className={`w-5 h-5 rounded-md ml-5 m-2 items-center justify-center border ${rememberMe ? "bg-brand-primary border-brand-primary" : "bg-transparent border-brand-primary/70"}`}>
                      {rememberMe && <Text className="text-brand-secondary font-bold text-xs leading-none">✓</Text>}
                    </View>
                    <Text className="text-white text-sm">Remember me</Text>
                  </TouchableOpacity>

                  <Pressable onPress={onForgotPassword}>
                    <Text className="text-brand-primary text-sm font-semibold">
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>

                 <Pressable
                    onPress={signInForm.handleSubmit(onLogin)}
                    disabled={isLoading}
                    className="rounded-xl items-center justify-center bg-brand-primary/75 self-center"
                    style={{ height: 50, width: 165 }}
                  >
                  <Text className="text-white font-semibold text-sm"> {isLoading ? "Loading..." : "Continue"} </Text>
                </Pressable>

                {/* Divider */}
                <View className="flex-row items-center m-8">
                  <View className="flex-1 h-px bg-white" />
                  <Text className="text-white text-xs mx-3">or</Text>
                  <View className="flex-1 h-px bg-white" />
                </View>

                {/* Google Sign In */}
                <Pressable
                  onPress={() => {}}
                  className="flex-row items-center justify-center self-center border border-white/70 rounded-xl h-[52px] w-[200px] bg-brand-secondary"
                >
                  {/* Google "G" logo using coloured text blocks */}
                  <View className="mr-3 w-5 h-5 items-center justify-center">
                     <Google width={20} height={20} />
                  </View>
                  <Text className="text-white/80 text-sm font-semibold">Continue with Google</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text className="text-white text-lg font-bold mb-1">Create account</Text>
                <Controller
                  control={signUpForm.control}
                  name="full_name"
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      variant="dark"
                      label="Full Name"
                      placeholder="Enter your full name"
                      value={value}
                      onChangeText={onChange}
                      errorText={signUpForm.formState.errors.full_name?.message}
                    />
                  )}
                />

                <Controller
                  control={signUpForm.control}
                  name="email"
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      variant="dark"
                      label="Email"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                      errorText={signUpForm.formState.errors.email?.message}
                    />
                  )}
                />

                <Controller
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <TextField
                      variant="dark"
                      label="Password"
                      placeholder="Enter your password"
                      secureTextEntry={!showSignUpPassword}
                      value={field.value}
                      onChangeText={field.onChange}
                      errorText={signUpForm.formState.errors.password?.message}
                      rightElement={
                        <Pressable onPress={() => setShowSignUpPassword(!showSignUpPassword)}>
                          {showSignUpPassword
                            ? <EyeOpenIcon width={22} height={22} />
                            : <EyeClosedIcon width={22} height={22} />}
                        </Pressable>
                      }
                    />
                  )}
                />

                <Controller
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <TextField
                      variant="dark"
                      label="Confirm Password"
                      placeholder="Enter password again"
                      secureTextEntry={!showConfirmPassword}
                      value={field.value}
                      onChangeText={field.onChange}
                      errorText={signUpForm.formState.errors.confirmPassword?.message}
                      rightElement={
                        <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword
                            ? <EyeOpenIcon width={22} height={22} />
                            : <EyeClosedIcon width={22} height={22} />}
                        </Pressable>
                      }
                    />
                  )}
                />
                <Pressable
                  onPress={signUpForm.handleSubmit(onSignUp)}
                  disabled={isLoading}
                  className="rounded-xl items-center justify-center bg-brand-primary/75 self-center"
                  style={{ height: 50, width: 165 }}
                >
                <Text className="text-white font-semibold text-sm"> {isLoading ? "Loading..." : "Continue"} </Text>
                </Pressable>

                {/* Divider */}
                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bg-white" />
                  <Text className="text-white text-xs mx-3">or</Text>
                  <View className="flex-1 h-px bg-white" />
                </View>

                {/* Google Sign Up */}
                <Pressable
                  onPress={() => {}}
                  className="flex-row items-center justify-center border self-center border-white/70 rounded-xl h-[52px] w-[200px] bg-brand-secondary"
                >
                  <View className="mr-3 w-5 h-5 items-center justify-center">
                    <Google width={20} height={20} />
                  </View>
                  <Text className="text-white/80 text-sm font-semibold">Continue with Google</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}