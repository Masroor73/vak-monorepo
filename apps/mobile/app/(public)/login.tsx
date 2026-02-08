import { useState, useEffect } from "react";
import { View, Alert, Pressable, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { TextField, PrimaryButton } from "@vak/ui";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { useForm, Controller } from "react-hook-form";
import Logo from "../../assets/Logo.svg";
import { LoginSchema } from '@vak/contract';

export default function LoginScreen() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      rememberMe: false,
    },
  });

  // Watch password and confirmPassword fields to check if they match
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  // Function to handle Sign Up
  const onSignUp = async (data: any) => {
    const { email, password, confirmPassword, rememberMe } = data;
    // Check if passwords match
    if (password !== confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call supabase to sign up the user
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        Alert.alert("Error", "Something went wrong. Please try again later.");
      } else {
        // Once the user is successfully signed up, navigate to the next step
        router.push("/signup"); // This will navigate to the second screen
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  // Function to handle Login
  const onLogin = async (data: any) => {
    const { email, password, rememberMe } = data;
    setIsLoading(true);
    try {
      const { data: loginData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !loginData.session) {
        setError("email", {
          type: "manual",
          message: "Invalid email",
        });
        setError("password", {
          type: "manual",
          message: "Invalid password",
        });
      } else {
        if (rememberMe) {
          console.log("User will be remembered until logout.");
        }
        router.replace("/(tabs)");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!loading && session) {
      router.replace("/(tabs)");
    }
  }, [session, loading]);
  return (
    <View className="flex-1 bg-white">
      <View className="w-full h-1/2 bg-[#62CCEF] rounded-b-[30px]">
        <View className="items-center justify-center flex-1 -mt-12 -mb-1">
          <Logo width={128} height={128} />
        </View>
      </View>
      <View className="flex-1 bg-white">
        {/* Sliding Toggle */}
        <View className="flex-row bg-white border border-black rounded-full overflow-hidden w-[250px] h-[50px] self-center -mt-20">
          <Pressable
            className={`flex-1 items-center justify-center rounded-full ${ activeTab === "signin" ? "bg-black" : "bg-transparent" }`}
            onPress={() => setActiveTab("signin")}
          >
            <Text className={`text-lg font-semibold ${activeTab === "signin" ? "text-white" : "text-black"}`}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 items-center justify-center rounded-full ${ activeTab === "signup" ? "bg-black" : "bg-transparent"}`}
            onPress={() => setActiveTab("signup")}
          >
            <Text className={`text-lg font-semibold ${activeTab === "signup" ? "text-white" : "text-black"}`}>
              Sign Up
            </Text>
          </Pressable>
        </View>
        <View className="w-full max-w-md self-center space-y-4 mt-6">
          {activeTab === "signup" ? (
            <>
              {/* Email Field */}
              <Controller
                control={control}
                name="email"
                rules={{ required: "Email is required" }}
                render={({ field: { onChange, value } }) => (
                  <TextField
                    label="Email"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    errorText={errors.email?.message}
                  />
                )}
              />
              {/* Password Field */}
              <Controller
                control={control}
                name="password"
                rules={{
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" }
                }}
                render={({ field: { onChange, value } }) => (
                  <TextField
                    label="Password"
                    placeholder="Enter password"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    errorText={errors.password?.message}
                  />
                )}
              />
              {/* Confirm Password Field */}
              <Controller
                control={control}
                name="confirmPassword"
                rules={{
                  required: "Confirm Password is required",
                }}
                render={({ field: { onChange, value } }) => (
                  <TextField
                    label="Confirm Password"
                    placeholder="Enter password again"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    errorText={errors.confirmPassword?.message}
                  />
                )}
              />
              {/* Sign Up Button */}
              <View className="self-center space-y-10">
                <PrimaryButton
                  title="Next"
                  onPress={handleSubmit(onSignUp)} // Submit the form
                  isLoading={isLoading}
                />
              </View>
            </>
          ) : (
            <>
              {/* Sign In Fields */}
              <Controller
                control={control}
                name="email"
                rules={{ required: "Email is required" }}
                render={({ field: { onChange, value } }) => (
                  <TextField
                    label="Email"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    errorText={errors.email?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                rules={{ required: "Password is required" }}
                render={({ field: { onChange, value } }) => (
                  <TextField
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    errorText={errors.password?.message}
                  />
                )}
              />
              {/* Remember Me Checkbox */}
              <Controller
                control={control}
                name="rememberMe"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    onPress={() => onChange(!value)}
                    className="flex-row items-center mb-3 self-center"
                  >
                    <View className="w-5 h-5 border-[#063386] rounded-sm justify-center items-center mr-2 bg-[#063386]">
                      {value && (
                        <Text className="text-[#05CC66] font-bold text-base text-center -translate-y-1">
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text className="text-sm">Remember Me</Text>
                  </TouchableOpacity>
                )}
              />
              {/* Sign In Button */}
              <View className="self-center space-y-10">
                <PrimaryButton
                  title="Sign In"
                  onPress={handleSubmit(onLogin)} // Handle login
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
