import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { TextField, PrimaryButton } from "@vak/ui";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import Logo from "../../assets/Logo.svg";
import { ResetPasswordSchema, ResetPasswordInput, PASSWORD_RULES } from "@vak/contract";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const PasswordRequirementsBox = ({
  password,
  confirmPassword,
  showMismatch,
}: {
  password: string;
  confirmPassword: string;
  showMismatch: boolean;
}) => {
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  return (
     <View className="bg-auth-deep border border-white/60 rounded-xl p-4 mb-4 mr-4 ml-4">
      <Text className="text-white text-xs font-bold mb-2 uppercase tracking-wide">
        Password Requirements
      </Text>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View key={rule.label} className="flex-row items-center gap-2 mb-1">
            <View className={`w-4 h-4 rounded-full items-center justify-center ${met ? "bg-green-500" : "bg-white/60"}`}>
              {met && <Text className="text-white text-[9px] font-bold">✓</Text>}
            </View>
            <Text className={`text-xs ${met ? "text-green-500" : "text-white"}`}>
              {rule.label}
            </Text>
          </View>
        );
      })}
      {confirmPassword.length > 0 && (
        <View className="flex-row items-center gap-2 mb-1">
          <View className={`w-4 h-4 rounded-full items-center justify-center ${passwordsMatch ? "bg-green-500" : "bg-red-500"}`}>
            <Text className="text-white text-[9px] font-bold">{passwordsMatch ? "✓" : "✕"}</Text>
          </View>
          <Text className={`text-xs ${passwordsMatch ? "text-green-400" : "text-red-400"}`}>
            Passwords match
          </Text>
        </View>
      )}
      {showMismatch && (
        <View className="flex-row items-center gap-2 mt-1">
          <View className="w-4 h-4 rounded-full items-center justify-center bg-red-500">
            <Text className="text-white text-[9px] font-bold">✕</Text>
          </View>
          <Text className="text-xs text-red-400">Passwords do not match</Text>
        </View>
      )}
    </View>
  );
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const { control, handleSubmit, watch, formState: { errors }, clearErrors } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Ready to reset password");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      clearErrors();
      setServerError(null);
    }, 15000);
    return () => clearTimeout(t);
  }, [errors.password, errors.confirmPassword, serverError]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    });

    setIsLoading(false);

    if (updateError) {
      setServerError(updateError.message);
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <View className="flex-1 bg-auth-primary justify-center px-5">
        <View className="items-center mb-10">
          <View className="w-28 h-28 items-center justify-center">
            <Logo width={110} height={100} />
          </View>
          <Text className="text-auth-accent text-[20px] font-extrabold tracking-[2px] uppercase mt-2">
            V.A.K
          </Text>
        </View>

        <View className="bg-auth-deep rounded-xl p-8 border-2 border-white/10 items-center">
          <View className="w-20 h-20 rounded-full bg-green-500/20 border border-green-400/60 items-center justify-center mb-5">
            <Feather name="check-circle" size={40} color="#22c55e" />
          </View>
          <Text className="text-white text-xl font-bold mb-3">Password updated!</Text>
          <Text className="text-white/60 text-sm text-center leading-6 mb-8 px-2">
            Your password has been changed successfully. You can now sign in with your new password.
          </Text>
          <View className="bg-auth-accent rounded-lg h-[50px] w-[200px] items-center justify-center">
           <PrimaryButton
             title="Back to Sign In"
             onPress={() => router.replace("/(public)/login")}
             isLoading={false}
             className="h-full w-full bg-transparent"
           />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 bg-auth-primary justify-center px-5">

        {/* header */}
        <View className="items-center mb-8">
          <View className="w-28 h-28 items-center justify-center">
            <Logo width={110} height={100} />
          </View>
          <Text className="text-auth-accent text-[20px] font-extrabold tracking-[2px] uppercase mt-2">
            V.A.K
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-auth-deep rounded-xl p-6 border-2 border-white/10">
            <Text className="text-white text-lg font-bold mb-1">Set new password</Text>
            <Text className="text-white/70 text-sm leading-5 mb-6">
              Choose a strong password for your account.
            </Text>

            {/* icon row */}
            <View className="flex-row items-center mb-6 gap-3">
              <View className="w-14 h-14 rounded-full bg-auth-accent/20 border border-auth-accent/60 items-center justify-center">
                <Feather name="lock" size={24} color="#3A9AFF" />
              </View>
              <View className="flex-1 h-px bg-white/30" />
            </View>

            {/* new password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange } }) => (
                <>
                  <TextField
                    variant="dark"
                    label="New password"
                    placeholder="Enter password here"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    errorText={errors.password?.message}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    rightElement={
                      <Pressable onPress={() => setShowPassword(!showPassword)}>
                        <Feather name={showPassword ? "eye" : "eye-off"} size={22} color="#ffffff60" />
                      </Pressable>
                    }
                  />
                  {isPasswordFocused && (
                    <PasswordRequirementsBox
                      password={watchedPassword}
                      confirmPassword={watchedConfirmPassword}
                      showMismatch={errors.confirmPassword?.message === "Passwords do not match."}
                    />
                  )}
                </>
              )}
            />

            {/* confirm password */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { value, onChange } }) => (
                <TextField
                  variant="dark"
                  label="Confirm password"
                  placeholder="Repeat your password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirm}
                  errorText={errors.confirmPassword?.message}
                  rightElement={
                    <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                      <Feather name={showConfirm ? "eye" : "eye-off"} size={22} color="#ffffff60" />
                    </Pressable>
                  }
                />
              )}
            />

            {serverError && (
              <Text className="text-red-500 text-xs text-center -mt-2 mb-3">{serverError}</Text>
            )}

            <View className="flex-row items-center justify-between mt-6 gap-6 ml-5 mr-5">
              <View className="flex-1 h-[50px] rounded-xl border border-auth-accent/30 bg-brand-secondary/70">
               <PrimaryButton
                 title="Back"
                 onPress={() => router.replace("/(public)/login")}
                 isLoading={false}
                 className="h-full w-full bg-transparent"
               />
              </View>
              <View className="flex-1 bg-auth-accent rounded-lg h-[50px] items-center justify-center">
                <PrimaryButton
                  title={isLoading ? "Updating..." : "Update"}
                  onPress={handleSubmit(onSubmit)}
                  isLoading={isLoading}
                  className="h-full w-full bg-transparent"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}