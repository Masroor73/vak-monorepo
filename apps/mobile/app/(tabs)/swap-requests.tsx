import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
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
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F5F5" }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 20 }}>
        Swap Requests
      </Text>

      {requests.length === 0 ? (
        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "600", fontSize: 16 }}>
            No swap requests
          </Text>
          <Text style={{ color: "#777", marginTop: 6 }}>
            Your swap requests will appear here.
          </Text>
        </View>
      ) : (
        requests.map((req) => (
          <View
            key={req.id}
            style={{
              backgroundColor: "white",
              padding: 18,
              borderRadius: 12,
              marginBottom: 12,
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
  );
}