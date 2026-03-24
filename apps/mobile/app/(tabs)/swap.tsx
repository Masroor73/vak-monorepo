import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Swap = {
  id: string;
  status: string;
  reason: string | null;
  created_at: string;
};

export default function Messages() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSwaps();

    const channel = supabase
      .channel("swap-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_swaps",
        },
        () => {
          loadSwaps();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadSwaps() {
    if (!user) return;

    const { data, error } = await supabase
      .from("shift_swaps")
      .select("*")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Swap error:", error);
      setLoading(false);
      return;
    }

    setSwaps(data || []);
    setLoading(false);
  }

  function getStatus(status: string) {
    if (status === "PENDING") return "🟡 Pending";
    if (status === "APPROVED") return "🟢 Approved";
    if (status === "DECLINED" || status === "DENIED") return "🔴 Denied";
    return status;
  }

  async function handleDelete(swap: Swap) {
    if (swap.status !== "PENDING") {
      Alert.alert("Cannot delete", "This request has already been processed");
      return;
    }

    const { error } = await supabase
      .from("shift_swaps")
      .delete()
      .eq("id", swap.id);

    if (error) {
      Alert.alert("Delete failed", error.message);
      return;
    }

    setSwaps((prev) => prev.filter((s) => s.id !== swap.id));
    Alert.alert("Swap request deleted");
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1E3B" }}>

      {/* 🔵 HEADER (same as Clock-In) */}
      <View style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16 }}>
  <View style={{ flexDirection: "row", alignItems: "center" }}>

    <Ionicons
      name="arrow-back"
      size={24}
      color="white"
      onPress={() => router.back()}
    />

    <Text
      style={{
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        flex: 1,
      }}
    >
      Shift Swap Updates
    </Text>

  </View>
</View>

      {/* ⚪ CONTENT */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F5F5F5" }}
        contentContainerStyle={{ padding: 16 }}
      >

        {swaps.length === 0 && (
          <Text style={{ color: "gray" }}>No swap requests yet.</Text>
        )}

        {swaps.map((swap) => (
          <View
            key={swap.id}
            style={{
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              backgroundColor: "#fff",

              // ✅ SAME AS CLOCK-IN CARD STYLE
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              Shift Swap Request
            </Text>

            <Text style={{ marginTop: 5 }}>
              Status: {getStatus(swap.status)}
            </Text>

            {swap.reason && (
              <Text style={{ color: "gray", marginTop: 5 }}>
                Reason: {swap.reason}
              </Text>
            )}

            <Text style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
              {new Date(swap.created_at).toLocaleString()}
            </Text>

            {swap.status === "PENDING" && (
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Delete request?",
                    "Are you sure you want to delete this swap request?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", onPress: () => handleDelete(swap) }
                    ]
                  )
                }
                style={{
                  marginTop: 10,
                  backgroundColor: "#ef4444",
                  padding: 10,
                  borderRadius: 6,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Delete Request
                </Text>
              </Pressable>
            )}

          </View>
        ))}

      </ScrollView>
    </View>
  );
}