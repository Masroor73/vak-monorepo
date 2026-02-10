import { useState, useEffect } from "react";
import { View, Alert, Pressable, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { TextField, PrimaryButton } from "@vak/ui";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { useForm, Controller } from "react-hook-form";
import Logo from "../../assets/Logo.svg";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput, SignupSchema, SignupInput } from "@vak/contract";

export default function LoginScreen() {
  const router = useRouter();
  const { session, loading, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [rememberMe, setRememberMe] = useState(false);

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
          [
            { text: "OK", onPress: () => setActiveTab("signin") },
          ]
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
    const { email, password } = data;

    setIsLoading(true);
    try {
      const { data: loginData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !loginData.session) {
        Alert.alert("Invalid Credentials", "Email or password is incorrect.");
      } else {
        if (rememberMe) {
          console.log("User will be remembered until logout.");
        }
        router.replace("/(tabs)");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- AUTO-CLEAR ERRORS ----------------
  useEffect(() => {
    const timer = setTimeout(() => {
      signInForm.clearErrors();
      signUpForm.clearErrors();
    }, 15000);
    return () => clearTimeout(timer);
  }, [signInForm.formState.errors, signUpForm.formState.errors]);

  // ---------------- REDIRECT IF LOGGED IN ----------------
  useEffect(() => {
    if (!loading && session) {
      router.replace("/(tabs)");
    }
  }, [session, loading]);

  return (
    <View className="flex-1 bg-white">
      {/* Logo Section */}
      <View className="w-full h-1/2 bg-damascus-VAKBlue rounded-b-[35px] -mt-12">
        <View className="items-center justify-center flex-1">
          <Logo width={128} height={128} />
        </View>
      </View>

      {/* Form Section */}
      <View className="flex-1 bg-white">
        {/* Sliding Toggle */}
        <View className="flex-row bg-white border border-black rounded-full overflow-hidden w-[250px] h-[50px] self-center -mt-20">
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
                 render={({ field: { value, onChange } }) => (
                  <TextField
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    errorText={signUpForm.formState.errors.password?.message}
                  />
                )}
              />

              {/* Confirm Password */}
              <Controller
                 control={signUpForm.control}
                 name="confirmPassword"
                 render={({ field, fieldState }) => (
                  <TextField
                  label="Confirm Password"
                  placeholder="Enter password again"
                  secureTextEntry
                  value={field.value}
                  onChangeText={field.onChange}
                  errorText={fieldState?.error?.message} 
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
                    onChangeText={field.onChange}
                    errorText={signInForm.formState.errors.email?.message}
                  />
                )}
              />

              {/* Password */}
              <Controller
                control={signInForm.control}
                name="password"
                render={({ field }) => (
                  <TextField
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry
                    value={field.value}
                    onChangeText={field.onChange}
                    errorText={signInForm.formState.errors.password?.message}
                  />
                )}
              />

              {/* Remember Me */}
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                className="flex-row items-center mb-3 self-center"
              >
                <View className="w-5 h-5 rounded-sm justify-center items-center mr-2 bg-damascus-VAKDarkBlue">
                  {rememberMe && (
                    <Text className="text-damascus-VAKGreen font-bold text-base text-center -translate-y-1">
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
