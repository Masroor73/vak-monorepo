import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Logo from "../../assets/Logo.svg";
import { Circle, Ring, Diamond } from "../../src/components/Shapes";

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(public)/login");
  };

  return (
    <View className="flex-1 bg-auth-primary">

      {/* ── TOP SECTION with logo and shapes ── */}
      <View className="bg-auth-primary items-center overflow-hidden pt-20 pb-3">
        <Circle  className="w-52 h-52 bg-auth-mid -top-20 -right-10" />
        <Ring    className="w-36 h-36 border-brand-primary top-20 -right-8" />
        <Diamond className="w-5  h-5  bg-brand-primary top-16 right-24" />
        <Diamond className="w-6  h-6  bg-auth-accent top-24 left-8" />
        <View className="z-10 w-36 h-36 items-center justify-center mt-5">
          <Logo width={110} height={100} />
        </View>
        <Text className="text-auth-accent text-[25px] font-extrabold tracking-[2px] uppercase">
          V.A.K
        </Text>
      </View>

      {/* ── CARD ── */}
      <View className="flex-1 mx-5 mt-4">
        <View className="bg-auth-deep rounded-xl p-6 border-2 border-white/30">

          {/* Icon */}
          <View className="items-center mb-5">
            <View className="w-16 h-16 rounded-full bg-auth-primary border-2 border-white/20 items-center justify-center">
              <MaterialCommunityIcons name="account-clock-outline" size={32} color="#3B8BEB" />
            </View>
          </View>

          {/* Heading */}
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Pending Approval
          </Text>
          <Text className="text-white text-center mb-6 leading-6">
            Your account has been created and is awaiting manager approval before you can access the app.
          </Text>

          {/* Status rows */}
          <View className="border border-white/20 rounded px-4 py-4 mb-6">

            <Text className="text-white/80 text-[11px] font-bold tracking-widest uppercase mb-3">
              Account Status
            </Text>

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-md font-semibold">Registration</Text>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <View className="w-2 h-2 rounded-full bg-green-400" />
                <Text className="text-green-400 text-md font-bold">Complete</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-md font-semibold">Manager Approval</Text>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <View className="w-2 h-2 rounded-full bg-auth-accent" />
                <Text className="text-auth-accent text-md font-bold">Pending</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-white text-md font-semibold">App Access</Text>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <View className="w-2 h-2 rounded-full bg-red-400" />
                <Text className="text-red-400 text-md font-bold">Locked</Text>
              </View>
            </View>

          </View>

          {/* Note */}
          <Text className="text-white text-center mb-6">
            You'll be able to log in once a manager approves your account.
          </Text>

          {/* Sign Out */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-auth-accent rounded-xl py-4 items-center"
          >
            <Text className="text-white text-base font-bold tracking-widest uppercase">
              Sign Out
            </Text>
          </TouchableOpacity>

        </View>
      </View>

    </View>
  );
}
