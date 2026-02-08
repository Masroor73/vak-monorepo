import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function IndexScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    if (loading) {
      console.log("Still loading session...");
      return; // Don't proceed until loading is false
    }

    console.log("Session status in layout:", session);

    if (session) {
      console.log("Session found. Redirecting to tabs...");
      router.replace("/(tabs)"); // Redirect to tabs if session exists
    } else {
      console.log("No session found. Redirecting to login...");
      router.replace("/(public)/login"); // Redirect to login if no session
    }

    setHasCheckedSession(true); // Mark session check complete
  }, [session, loading, router]);

  if (!hasCheckedSession) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return null;
}
