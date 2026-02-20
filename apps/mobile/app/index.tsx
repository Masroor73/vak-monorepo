//apps/mobile/app/index.tsx
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function IndexScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
  if (loading) return;

  if (!session) {
    router.replace("/(public)/login");
    return;
  }

  router.replace("/(tabs)");
}, [session, loading]);
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}
