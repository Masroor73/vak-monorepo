import { useState, useEffect } from "react";
import { View, Pressable, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { TextField, PrimaryButton } from "@vak/ui";
import { useAuth } from "../../context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import Logo from "../../assets/Logo.svg";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput, SignupSchema, SignupInput, PASSWORD_RULES } from "@vak/contract";
import EyeOpenIcon from "../../assets/eyeOpen.svg";
import EyeClosedIcon from "../../assets/eyeClosed.svg";
import { GoogleButton } from "../../src/components/GoogleButton";
import { Circle, Ring, Diamond } from "../../src/components/Shapes";
import { checkProfanity } from "@/src/utils/profanityFilter";
import { Feather } from "@expo/vector-icons";

const PasswordRequirementsBox = ({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword: string;
  showMismatch: boolean;
}) => {
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  return (
    <View className="bg-auth-deep border border-white/40 rounded-xl px-4 py-3 mb-4 mr-4 ml-4">
      <Text className="text-white text-[15px] font-semibold mb-2 uppercase tracking-wide">
        Password Requirements
      </Text>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View key={rule.label} className="flex-row items-center gap-2 mb-1">
            <View className={`w-4 h-4 rounded-full items-center justify-center ${met ? "bg-green-500" : "bg-white/60"}`}>
              {met && <Text className="text-white text-[9px] font-bold">✓</Text>}
            </View>
            <Text className={`text-[13px] ${met ? "text-green-500" : "text-white"}`}>{rule.label}</Text>
          </View>
        );
      })}
      {confirmPassword.length > 0 && (
        <View className="flex-row items-center gap-2 mb-1">
          <View className={`w-4 h-4 rounded-full items-center justify-center ${passwordsMatch ? "bg-green-500" : "bg-red-500"}`}>
            <Text className="text-white text-[9px] font-bold">{passwordsMatch ? "✓" : "✕"}</Text>
          </View>
          <Text className={`text-[13px] ${passwordsMatch ? "text-green-400" : "text-red-500"}`}>
            Passwords match
          </Text>
        </View>
      )}
    </View>
  );
};

function InlineError({ message }: { message: string }) {
  return (
    <View className="flex-row items-center gap-2 bg-red-500/10 border border-red-400/30 rounded px-7 py-2.5 mb-3 mx-4 mt-3 tracking-wide">
      <Feather name="alert-circle" size={17} color="red" />
      <Text className="text-red-500 text-[16px] flex-1 ml-2">{message}</Text>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const { session, loading, signUp, login, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [rememberMe, setRememberMe] = useState(false);

  // Sign in errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Sign up errors
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpNameError, setSignUpNameError] = useState<string | null>(null);
  const [signUpEmailError, setSignUpEmailError] = useState<string | null>(null);
  const [signUpPasswordError, setSignUpPasswordError] = useState<string | null>(null);
  const [signUpConfirmPasswordError, setSignUpConfirmPasswordError] = useState<string | null>(null);

  const onForgotPassword = () => router.push("/(public)/forgetPassword");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setGoogleError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error && error !== "CANCELLED") {
        setGoogleError("Google sign in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  const watchedPassword = signUpForm.watch("password");
  const watchedConfirmPassword = signUpForm.watch("confirmPassword");

  const clearSignInErrors = () => {
    setEmailError(null);
    setPasswordError(null);
    setLoginError(null);
    setAccessDeniedError(null);
  };

  useEffect(() => {
    if (activeTab === "signup") {
      signUpForm.reset({ email: "", password: "", full_name: "", confirmPassword: "" });
      setSignUpNameError(null);
      setSignUpEmailError(null);
      setSignUpPasswordError(null);
      setSignUpConfirmPasswordError(null);
    }
    if (activeTab === "signin") {
      signInForm.reset({ email: "", password: "" });
      clearSignInErrors();
    }
    setIsPasswordFocused(false);
    setGoogleError(null);
    setSignUpError(null);
  }, [activeTab]);

  const onLoginInvalid = (errors: any) => {
    if (errors.email) setEmailError(errors.email.message);
    if (errors.password) setPasswordError(errors.password.message);
  };

  const onSignUpInvalid = (errors: any) => {
    if (errors.full_name) setSignUpNameError(errors.full_name.message);
    if (errors.email) setSignUpEmailError(errors.email.message);
    if (errors.password) setSignUpPasswordError(errors.password.message);
    if (errors.confirmPassword) setSignUpConfirmPasswordError(errors.confirmPassword.message);
  };

  const onSignUp = async (data: SignupInput) => {
    setSignUpError(null);
    setSignUpNameError(null);
    setSignUpEmailError(null);

    const nameCheck = checkProfanity(data.full_name);
    const emailLocalPart = data.email.split("@")[0];
    const emailCheck = checkProfanity(emailLocalPart);

    if (nameCheck.hasProfanity) setSignUpNameError("Name contains inappropriate language.");
    if (emailCheck.hasProfanity) setSignUpEmailError("Email contains inappropriate language.");
    if (nameCheck.hasProfanity || emailCheck.hasProfanity) return;

    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.full_name);
      if (error) setSignUpError(error.message);
      else router.replace("/(public)/pendingApproval");
    } catch {
      setSignUpError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onLogin = async (data: LoginInput) => {
    setIsLoading(true);
    clearSignInErrors();
    try {
      const { error, pendingApproval } = await login(data.email, data.password, rememberMe);
      if (error === "INVALID_CREDENTIALS") { setLoginError("Invalid email or password."); return; }
      if (error === "ACCESS_DENIED") { setAccessDeniedError("Access denied. Employees only."); return; }
      if (pendingApproval) { router.replace("/(public)/pendingApproval" as any); return; }
      if (error) { setLoginError("Something went wrong. Please try again."); return; }
      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      signUpForm.clearErrors();
      clearSignInErrors();
      setGoogleError(null);
      setSignUpError(null);
      setSignUpNameError(null);
      setSignUpEmailError(null);
      setSignUpPasswordError(null);
      setSignUpConfirmPasswordError(null);
    }, 15000);
    return () => clearTimeout(t);
  }, [emailError, passwordError, loginError, accessDeniedError, googleError, signUpError, signUpForm.formState.errors, signUpNameError, signUpEmailError, signUpPasswordError, signUpConfirmPasswordError,]);

  useEffect(() => {
    if (!loading && session) router.replace("/(tabs)");
  }, [session, loading]);

  return (
    <View className="flex-1">
      <View className="bg-auth-primary items-center overflow-hidden pt-16 pb-3">
        <Circle className="w-52 h-52 bg-auth-mid -top-20 -right-10" />
        <Ring className="w-36 h-36 border-brand-primary top-20 -right-8" />
        <Diamond className="w-5 h-5 bg-brand-primary top-16 right-24" />
        <Diamond className="w-6 h-6 bg-auth-accent top-24 left-8" />
        <View className="z-10 w-36 h-36 items-center justify-center mt-5">
          <Logo width={110} height={100} />
        </View>
        <Text className="text-white text-[30px] font-extrabold tracking-[2px]">
          V<Text className="text-auth-accent">.</Text>
          A<Text className="text-auth-pending">.</Text>
          K
        </Text>
      </View>

      <View className="flex-1 bg-auth-primary overflow-hidden">
        <View className="flex-row mx-12 mb-6 bg-auth-primary border border-white/80 rounded-2xl p-1.5 z-10">
          <Pressable
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === "signin" ? "bg-auth-accent" : "bg-transparent"}`}
            onPress={() => setActiveTab("signin")}
          >
            <Text className="text-sm font-semibold text-white">Sign In</Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === "signup" ? "bg-auth-accent" : "bg-transparent"}`}
            onPress={() => setActiveTab("signup")}
          >
            <Text className="text-sm font-semibold text-white">Sign Up</Text>
          </Pressable>
        </View>

        <ScrollView key={activeTab} className="flex-1 mx-5 z-10">
          <View className="bg-auth-deep rounded-xl p-5 border-2 border-white/10">
            {activeTab === "signin" ? (
              <>
                <Text className="text-white text-lg font-bold mb-1">Welcome back</Text>
                <Text className="text-white text-l mb-5">Sign in to clock in for your shift</Text>

                <Controller
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <TextField
                      maxLength={254}
                      variant="dark"
                      label="Email"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={field.value}
                      onChangeText={(text) => {
                        field.onChange(text);
                        setEmailError(null);
                        setLoginError(null);
                        setAccessDeniedError(null);
                      }}
                      errorText={emailError ?? undefined}
                    />
                  )}
                />

                <Controller
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <TextField
                      maxLength={72}
                      variant="dark"
                      label="Password"
                      placeholder="Enter your password"
                      secureTextEntry={!showSignInPassword}
                      value={field.value}
                      onChangeText={(text) => {
                        field.onChange(text);
                        setPasswordError(null);
                        setLoginError(null);
                        setAccessDeniedError(null);
                      }}
                      errorText={passwordError ?? undefined}
                      rightElement={
                        <Pressable onPress={() => setShowSignInPassword(!showSignInPassword)}>
                          {showSignInPassword ? <EyeOpenIcon width={22} height={22} /> : <EyeClosedIcon width={22} height={22} />}
                        </Pressable>
                      }
                    />
                  )}
                />

                {loginError && <InlineError message={loginError} />}
                {accessDeniedError && <InlineError message={accessDeniedError} />}

                <View className="flex-row items-center justify-between mb-5 mt-1 mr-5">
                  <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} className="flex-row items-center">
                    <View className={`w-6 h-6 rounded-md ml-5 m-2 items-center justify-center border-2 ${rememberMe ? "bg-auth-accent border-auth-accent" : "bg-transparent border-auth-accent"}`}>
                      {rememberMe && <Text className="text-brand-secondary font-extrabold text-xl leading-none">✓</Text>}
                    </View>
                    <Text className="text-white font-semibold">Remember me</Text>
                  </TouchableOpacity>
                  <Pressable onPress={onForgotPassword}>
                    <Text className="text-white font-semibold">Forgot password?</Text>
                  </Pressable>
                </View>

                <View className="bg-auth-accent rounded-[8px] h-[50px] w-[165px] self-center">
                  <PrimaryButton
                    title={isLoading ? "Loading..." : "Continue"}
                    onPress={signInForm.handleSubmit(onLogin, onLoginInvalid)}
                    isLoading={isLoading}
                    className="h-full w-full bg-transparent"
                  />
                </View>

                <View className="flex-row items-center m-8">
                  <View className="flex-1 h-px bg-white" />
                  <Text className="text-white text-md mx-3">or</Text>
                  <View className="flex-1 h-px bg-white" />
                </View>

                <GoogleButton onPress={handleGoogleSignIn} />
                {googleError && <InlineError message={googleError} />}
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
                      maxLength={50}
                      label="Full Name"
                      placeholder="Enter your full name"
                      value={value}
                      onChangeText={(text) => { onChange(text); setSignUpNameError(null); }}
                      errorText={signUpNameError ?? undefined}
                    />
                  )}
                />
                <Controller
                  control={signUpForm.control}
                  name="email"
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      maxLength={254}
                      variant="dark"
                      label="Email"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={(text) => { onChange(text); setSignUpEmailError(null); }}
                      errorText={signUpEmailError ?? undefined}
                    />
                  )}
                />
                <Controller
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <>
                      <TextField
                        maxLength={72}
                        variant="dark"
                        label="Password"
                        placeholder="Enter your password"
                        secureTextEntry={!showSignUpPassword}
                        value={field.value}
                        onChangeText={(text) => { field.onChange(text); setSignUpPasswordError(null); }}
                        errorText={signUpPasswordError ?? undefined}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        rightElement={
                          <Pressable onPress={() => setShowSignUpPassword(!showSignUpPassword)}>
                            {showSignUpPassword ? <EyeOpenIcon width={22} height={22} /> : <EyeClosedIcon width={22} height={22} />}
                          </Pressable>
                        }
                      />
                      {isPasswordFocused && (
                        <PasswordRequirementsBox
                          password={watchedPassword}
                          confirmPassword={watchedConfirmPassword}
                          showMismatch={signUpForm.formState.errors.confirmPassword?.message === "Passwords do not match"}
                        />
                      )}
                    </>
                  )}
                />
                <Controller
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <TextField
                      maxLength={72}
                      variant="dark"
                      label="Confirm Password"
                      placeholder="Enter password again"
                      secureTextEntry={!showConfirmPassword}
                      value={field.value}
                      onChangeText={(text) => { field.onChange(text); setSignUpConfirmPasswordError(null); }}
                      errorText={signUpConfirmPasswordError ?? undefined}
                      rightElement={
                        <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <EyeOpenIcon width={22} height={22} /> : <EyeClosedIcon width={22} height={22} />}
                        </Pressable>
                      }
                    />
                  )}
                />

                {signUpError && <InlineError message={signUpError} />}

                <View className="bg-auth-accent rounded-[8px] h-[50px] w-[165px] self-center">
                  <PrimaryButton
                    title={isLoading ? "Loading..." : "Continue"}
                    onPress={signUpForm.handleSubmit(onSignUp, onSignUpInvalid)}
                    isLoading={isLoading}
                    className="h-full w-full bg-transparent"
                  />
                </View>

                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bg-white" />
                  <Text className="text-white text-md mx-3">or</Text>
                  <View className="flex-1 h-px bg-white" />
                </View>

                <GoogleButton onPress={handleGoogleSignIn} />
                {googleError && <InlineError message={googleError} />}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}