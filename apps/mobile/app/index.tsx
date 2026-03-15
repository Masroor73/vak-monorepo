import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function IndexScreen() {
  const router = useRouter();
  const { session, loading, profile } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    if (!profile?.is_approved) {
      router.replace("/(public)/pendingApproval" as any);
      return;
    }

    router.replace("/(tabs)");
  }, [session, loading, profile, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <ActivityIndicator size="large" color="#063386" />
    </View>
  );
}