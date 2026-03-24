import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type SwapRequest = {
  id: string;
  requester_id: string;
  recipient_id: string;
  shift_id: string;
  status: string;
  created_at: string;
};

export default function SwapRequestsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    if (!user) return;

    const { data, error } = await supabase
      .from("shift_swaps")
      .select("*")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setRequests(data || []);
    setLoading(false);
  }

  async function updateSwapStatus(id: string, status: string) {
    const { error } = await supabase
      .from("shift_swaps")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.log("Swap update error:", error);
      return;
    }

    loadRequests();
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1E3B" }}>

      {/* 🔵 HEADER */}
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
              marginLeft: 10,
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

        {/* Optional Title (can remove if you want cleaner UI) */}
        <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 20 }}>
          Swap Requests
        </Text>

        {requests.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              marginTop: 80,
            }}
          >
            <Ionicons name="swap-horizontal-outline" size={60} color="#4F46E5" />
            <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 10 }}>
              No Swap Requests
            </Text>
            <Text style={{ color: "#6B7280", marginTop: 5 }}>
              When swaps happen, they will appear here
            </Text>
          </View>
        ) : (
          requests.map((req) => (
            <View
              key={req.id}
              style={{
                backgroundColor: "white",
                padding: 18,
                borderRadius: 14,
                marginBottom: 12,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                Shift ID: {req.shift_id}
              </Text>

              <Text style={{ color: "#666", marginTop: 6 }}>
                Status: {req.status}
              </Text>

              <Text style={{ color: "#999", marginTop: 4 }}>
                {new Date(req.created_at).toLocaleDateString()}
              </Text>

              {req.status === "pending" && (
                <View style={{ flexDirection: "row", marginTop: 12 }}>
                  <Pressable
                    onPress={() => updateSwapStatus(req.id, "approved")}
                    style={{
                      backgroundColor: "#16a34a",
                      padding: 8,
                      borderRadius: 6,
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ color: "white" }}>Approve</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateSwapStatus(req.id, "rejected")}
                    style={{
                      backgroundColor: "#dc2626",
                      padding: 8,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "white" }}>Reject</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}