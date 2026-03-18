import { useState, useEffect } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { TextField, PrimaryButton } from "@vak/ui";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import Logo from "../../assets/Logo.svg";
import { ForgotPasswordSchema, ForgotPasswordInput } from "@vak/contract";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Circle, Ring, Diamond } from "../../src/components/Shapes";

export default function ForgetPasswordScreen() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, handleSubmit, getValues, formState: { errors }, clearErrors } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const onBack = () => router.back();

  useEffect(() => {
    const t = setTimeout(() => {
      clearErrors();
      setServerError(null);
    }, 15000);
    return () => clearTimeout(t);
  }, [errors.email, serverError]);

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    setIsLoading(true);

    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(data.email, {
       redirectTo: "http://localhost:8082/(public)/resetPassword",
    });

    setIsLoading(false);

    if (supabaseError) {
      setServerError(supabaseError.message);
      return;
    }

    setSubmitted(true);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 bg-auth-primary overflow-hidden">
        <Circle  className="w-52 h-52 bg-auth-mid -top-20 -left-10" />
        <Ring    className="w-36 h-36 border-brand-primary top-20 -left-8" />
        <Diamond className="w-5  h-5  bg-brand-primary top-16 left-24" />
        <Diamond className="w-6  h-6  bg-auth-accent   top-24 right-8" />
        <Circle  className="w-32 h-32 bg-auth-mid/40   -bottom-10 -right-10" />
        <Diamond className="w-4  h-4  bg-brand-primary/60 bottom-24 left-12" />

        {/* header */}
        <View className="items-center pt-28 pb-6 z-10">
          <View className="w-28 h-28 items-center justify-center">
            <Logo width={110} height={100} />
          </View>
          <Text className="text-auth-accent text-[20px] font-extrabold tracking-[2px] uppercase p-2">
            V.A.K
          </Text>
        </View>

        {/* card */}
        <ScrollView
          className="flex-1 mx-5 z-10"
        >
          <View className="bg-auth-deep rounded p-10 border-2 border-white/10">
            {!submitted ? (
              <>
                <Text className="text-white text-lg font-bold mb-1">Reset password</Text>
                <Text className="text-white mb-8 leading-5 pt-2">
                  Enter the email linked to your account. We'll send you a secure reset link.
                </Text>

                <View className="flex-row items-center mb-8 gap-3">
                  <View className="w-16 h-16 rounded-full bg-auth-accent/20 border border-auth-accent/60 items-center justify-center">
                    <Feather name="key" size={27} color="#3A9AFF" />
                  </View>
                  <View className="flex-1 h-px bg-white/30" />
                </View>

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      variant="dark"
                      label="Email address"
                      placeholder="Enter your email"
                      value={value}
                      onChangeText={(t) => { onChange(t); if (serverError) setServerError(null); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      errorText={errors.email?.message}
                      rightElement={<Feather name="mail" size={26} color="#ffffff60" />}
                    />
                  )}
                />

                {serverError && (
                  <Text className="text-red-500 text-xl text-center -mt-2 mb-3">{serverError}</Text>
                )}

                <View className="flex-row items-center justify-between mt-8 gap-6 pr-4 pl-4">

                  <View className="rounded-xl h-[50px] w-full flex-1 self-center border border-auth-accent/30 bg-brand-secondary/70">
                   <PrimaryButton
                    title="Back"
                    onPress={onBack}
                    isLoading={false}
                    className="h-full w-full bg-transparent"
                    />
                   </View>

                  <View className="flex-1 bg-auth-accent rounded-[8px] h-[50px] items-center justify-center">
                    <PrimaryButton
                      title={isLoading ? "Sending..." : "Send link"}
                      onPress={handleSubmit(onSubmit)}
                      isLoading={isLoading}
                      className="h-full w-full bg-transparent flex-row items-center justify-center gap-2"
                    />
                  </View>

                </View>
              </>
            ) : (
              <View className="items-center">
                <View className="w-24 h-24 rounded-full bg-green-500/20 border border-green-400/60 items-center justify-center m-4">
                  <Feather name="check-circle" size={40} color="#22c55e" />
                </View>
                <Text className="text-white text-xl font-bold m-2 mb-4">Check your inbox</Text>
                <Text className="text-white text-center leading-6 mb-8 px-2 ">
                  If{" "}
                  <Text className="text-auth-accent">{getValues("email")}</Text>
                  {" "}is associated with an account, you'll receive a reset link shortly.
                </Text>
                
                <View className="bg-auth-accent rounded-[2px] h-[50px] w-[180px] items-center justify-center self-center">
                  <PrimaryButton
                   title="Back to Sign In"
                   onPress={onBack}
                   className="h-full w-full bg-transparent flex-row items-center justify-center"
                  />
                </View>

              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}