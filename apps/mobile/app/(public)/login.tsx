// apps/mobile/app/(public)/login.tsx
import { useState, useEffect } from "react";
import { View, Alert, Pressable, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { TextField, PrimaryButton } from "@vak/ui";
import { useAuth } from "../../context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import Logo from "../../assets/Logo.svg";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput, SignupSchema, SignupInput } from "@vak/contract";
import EyeOpenIcon from "../../assets/eyeOpen.svg";
import EyeClosedIcon from "../../assets/eyeClosed.svg";

export default function LoginScreen() {
  const router = useRouter();
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { session, loading, signUp, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [rememberMe, setRememberMe] = useState(false);

  const [loginError, setLoginError] = useState<string | null>(null);

  // ---------------- FORMS ----------------
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
    if (activeTab === "signup") {
      signUpForm.reset({
        email: "",
        password: "",
        full_name: "",
        confirmPassword: "",
      });
    }

    if (activeTab === "signin") {
      signInForm.reset({
        email: "",
        password: "",
      });
      setLoginError(null); // Clear login error on tab switch
    }
  }, [activeTab]);

  // ---------------- SIGN UP ----------------
  const onSignUp = async (data: SignupInput) => {
    const { email, password, full_name } = data;
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, full_name);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Success",
          "Please check your email to verify your account.",
          [{ text: "OK", onPress: () => setActiveTab("signin") }]
        );
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- LOGIN ----------------
  const onLogin = async (data: LoginInput) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const { error } = await login(data.email, data.password);

      if (error === "INVALID_CREDENTIALS") {
        setLoginError("Invalid email or password");
        return;
      }

      if (error === "ACCESS_DENIED") {
        Alert.alert("Access Denied", "Only employees can access this app.");
        return;
      }

      if (error) {
        setLoginError("Something went wrong. Please try again.");
        return;
      }

      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- AUTO-CLEAR ERRORS ----------------
  useEffect(() => {
    const timer = setTimeout(() => {
      signInForm.clearErrors();
      signUpForm.clearErrors();
      setLoginError(null);
    }, 15000);

    return () => clearTimeout(timer);
  }, [signInForm.formState.errors, signUpForm.formState.errors, loginError]);

  // ---------------- REDIRECT IF LOGGED IN ----------------
  useEffect(() => {
    if (!loading && session) {
      router.replace("/(tabs)");
    }
  }, [session, loading]);

  return (
    <View className="flex-1 bg-white">
      {/* Logo Section */}
      <View className="w-full h-1/2 bg-brand-primary rounded-b-[40px] -mt-12">
        <View className="items-center justify-center flex-1 mt-12">
          <Logo width={150} height={150} />
        </View>
      </View>

      {/* Form Section */}
      <View className="flex-1 bg-white">
        {/* Sliding Toggle */}
        <View className="flex-row bg-white border border-black rounded-full overflow-hidden w-[250px] h-[55px] self-center -mt-20">
          <Pressable
            className={`flex-1 items-center justify-center rounded-full ${
              activeTab === "signin" ? "bg-black" : "bg-transparent"
            }`}
            onPress={() => setActiveTab("signin")}
          >
            <Text
              className={`text-lg font-semibold ${
                activeTab === "signin" ? "text-white" : "text-black"
              }`}
            >
              Sign In
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 items-center justify-center rounded-full ${
              activeTab === "signup" ? "bg-black" : "bg-transparent"
            }`}
            onPress={() => setActiveTab("signup")}
          >
            <Text
              className={`text-lg font-semibold ${
                activeTab === "signup" ? "text-white" : "text-black"
              }`}
            >
              Sign Up
            </Text>
          </Pressable>
        </View>

        <View key={activeTab} className="w-full max-w-md self-center space-y-4 mt-6">
          {activeTab === "signup" ? (
            <>
              {/* Full Name */}
              <Controller
                control={signUpForm.control}
                name="full_name"
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={value}
                    onChangeText={onChange}
                    errorText={signUpForm.formState.errors.full_name?.message}
                  />
                )}
              />

              {/* Email */}
              <Controller
                control={signUpForm.control}
                name="email"
                render={({ field: { value, onChange } }) => (
                  <TextField
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

              {/* Password */}
              <Controller
                control={signUpForm.control}
                name="password"
                render={({ field }) => (
                  <TextField
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry={!showSignInPassword}
                    value={field.value}
                    onChangeText={field.onChange}
                    errorText={signInForm.formState.errors.password?.message}
                    rightElement={
                      <Pressable onPress={() => setShowSignUpPassword(!showSignUpPassword)}>
                        {showSignUpPassword ? (
                          <EyeOpenIcon width={24} height={24} />
                        ) : (
                          <EyeClosedIcon width={24} height={24} />
                        )}
                      </Pressable>
                    }
                  />
                )}
              />

              {/* Confirm Password */}
              <Controller
                control={signUpForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <TextField
                    label="Confirm Password"
                    placeholder="Enter password again"
                    secureTextEntry={!showConfirmPassword}
                    value={field.value}
                    onChangeText={field.onChange}
                    errorText={signUpForm.formState.errors.confirmPassword?.message}
                    rightElement={
                      <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? (
                          <EyeOpenIcon width={24} height={24} />
                        ) : (
                          <EyeClosedIcon width={24} height={24} />
                        )}
                      </Pressable>
                    }
                  />
                )}
              />

              <View className="self-center space-y-10">
                <PrimaryButton
                  title="Next"
                  onPress={signUpForm.handleSubmit(onSignUp)}
                  isLoading={isLoading}
                />
              </View>
            </>
          ) : (
            <>
              {/* Email */}
              <Controller
                control={signInForm.control}
                name="email"
                render={({ field }) => (
                  <TextField
                    label="Email"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={field.value}
                    onChangeText={(text) => {
                      field.onChange(text);
                      if (loginError) setLoginError(null);
                    }}
                    errorText={signInForm.formState.errors.email?.message}
                  />
                )}
              />

              {/* Password */}
              <Controller
                control={signInForm.control}
                name="password"
                render={({ field }) => (
                  <>
                    <TextField
                      label="Password"
                      placeholder="Enter your password"
                      secureTextEntry={!showSignInPassword}
                      value={field.value}
                      onChangeText={(text) => {
                        field.onChange(text);
                        if (loginError) setLoginError(null);
                      }}
                      errorText={signInForm.formState.errors.password?.message}
                      rightElement={
                        <Pressable onPress={() => setShowSignInPassword(!showSignInPassword)}>
                          {showSignInPassword ? (
                            <EyeOpenIcon width={24} height={24} />
                          ) : (
                            <EyeClosedIcon width={24} height={24} />
                          )}
                        </Pressable>
                      }
                    />
                    {/* Show general login error below password */}
                    {loginError && (
                      <Text className="text-red-600 text-center p-2">{loginError}</Text>
                    )}
                  </>
                )}
              />

              {/* Remember Me */}
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                className="flex-row items-center mb-3 self-center"
              >
                <View className="w-5 h-5 rounded-sm justify-center items-center mr-2 bg-brand-secondary">
                  {rememberMe && (
                    <Text className="text-brand-success font-bold text-base text-center -translate-y-1">
                      ✓
                    </Text>
                  )}
                </View>
                <Text className="text-sm">Remember Me</Text>
              </TouchableOpacity>

              <View className="self-center space-y-10">
                <PrimaryButton
                  title="Continue"
                  onPress={signInForm.handleSubmit(onLogin)}
                  isLoading={isLoading}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
