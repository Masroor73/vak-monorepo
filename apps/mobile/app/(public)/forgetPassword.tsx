import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { TextField } from "@vak/ui";


const Circle = ({ className }: { className: string }) => (
  <View className={`rounded-full absolute ${className}`} pointerEvents="none" />
);
const Ring = ({ className }: { className: string }) => (
  <View
    className={`rounded-full absolute bg-transparent border ${className}`}
    pointerEvents="none"
  />
);
const Diamond = ({ className }: { className: string }) => (
  <View className={`absolute rotate-45 ${className}`} pointerEvents="none" />
);

export default function ForgetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const onBack = () => router.back();

  const onSubmit = () => {
    //integrate with supabase
    // For now it just go back
    router.back();
  };

  return (
    <View className="flex-1 bg-brand-secondary">
      <View className="bg-brand-secondary items-center overflow-hidden pt-14 pb-4">
        <Circle className="w-52 h-52 bg-brand-secondaryLight -top-20 -right-16" />
        <Ring className="w-36 h-36 border-brand-primary/25 top-2 -right-8" />
        <Diamond className="w-7  h-7  bg-brand-primary/30 top-16 right-16" />
        <Diamond className="w-6  h-6  bg-brand-primary/50 top-24 left-8" />

        <Text className="z-10 text-white text-[26px] font-extrabold mt-10">
          Forgot password
        </Text>
        <Text className="z-10 text-white/50 text-xs mt-2 px-8 text-center leading-5">
          Please enter the email address or the phone number associated to the
          account. We will send you a secure link to change password if an
          account with the details you have entered is found.
        </Text>
      </View>

      <View className="flex-1 bg-brand-secondary overflow-hidden">
        <Circle className="w-40 h-40 bg-brand-primary/5 -bottom-16 -right-10" />
        <Circle className="w-24 h-24 bg-brand-secondaryLight/80 -bottom-1 -left-8" />

        <ScrollView
          className="flex-1 mx-5 z-10"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-brand-secondaryLight/80 rounded-3xl p-5 border border-white/10">
            <View className="items-center mb-4">
              <View className="h-20 w-20 rounded-full bg-brand-primary/70 items-center justify-center">
                <Text className="text-3xl">🔒</Text>
              </View>
            </View>

            <TextField
              variant="dark"
              label="Enter Email"
              placeholder="john@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View className="items-center my-2">
              <Text className="text-white/60 text-xs">Or</Text>
            </View>

            <TextField
              variant="dark"
              label="Phone No."
              placeholder="(84) 232 4456"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Pressable
              onPress={onBack}
              className="rounded-xl items-center justify-center bg-brand-primary/75 self-center mb-4"
              style={{ height: 50, width: 200 }}
            >
              <Text className="text-white font-semibold text-sm">Back</Text>
            </Pressable>

            <Pressable
              onPress={onSubmit}
              className="rounded-xl items-center justify-center bg-brand-primary/75 self-center"
              style={{ height: 50, width: 200 }}
            >
              <Text className="text-white font-semibold text-sm">Submit</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}