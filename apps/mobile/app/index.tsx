import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function IndexScreen() {
  const router = useRouter();
  const { session, loading,profile } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/(public)/login");
    } else {
      router.replace("/(tabs)");
    }
  }, [session, loading, router]);

   if (!profile?.is_approved) {        
      router.replace("/(public)/pendingApproval");
      return;
    }

  router.replace("/(tabs)");
}, [session, loading, profile]);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}