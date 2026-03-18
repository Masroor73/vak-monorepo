import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, RefreshControl, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type ClockHistory = {
  id: string;
  actual_start_time: string;
  clock_in_photo_url: string | null;
  clock_in_lat: number | null;
  clock_in_long: number | null;
  status: string | null;
};

export default function ClockHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState<ClockHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  async function loadHistory() {
     setLoading(true);
     
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("employee_id", user?.id)
      .not("actual_start_time", "is", null)
      .order("actual_start_time", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setHistory(data || []);
    setLoading(false);
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
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadHistory} />
      }
    >
      <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  }}
>
  <Ionicons
    name="arrow-back"
    size={24}
    color="#111"
    onPress={() => router.back()}
  />

  <Text
    style={{
      fontSize: 24,
      fontWeight: "700",
      marginLeft: 12,
    }}
  >
    Clock-In History
  </Text>
</View>
      {/* Summary Card */}
      <Pressable
  onPress={loadHistory}
  style={{
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  }}
>
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <Ionicons name="time-outline" size={22} color="#4F46E5" />
    <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "600" }}>
      {history.length} Clock-Ins
    </Text>
  </View>

  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <Text style={{ color: "#6B7280", marginRight: 6 }}>
      Refresh
    </Text>
    <Ionicons name="refresh" size={18} color="#6B7280" />
  </View>
</Pressable>
      {history.length === 0 ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 80,
          }}
        >
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 60,
              backgroundColor: "#EEF2FF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="time-outline" size={48} color="#4F46E5" />
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            No Clock-Ins Yet
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              maxWidth: 260,
              lineHeight: 20,
            }}
          >
            Once you clock in for a shift, your clock-in history will appear here.
          </Text>
        </View>
      ) : (
        history.map((shift) => (
          <View
            key={shift.id}
            style={{
              backgroundColor: "white",
              padding: 18,
              borderRadius: 12,
              marginBottom: 14,
              elevation: 2,
            }}
          >
            {/* Clock-in label */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Ionicons name="time-outline" size={18} color="#374151" />
              <Text style={{ fontWeight: "600", marginLeft: 6 }}>
                Clocked In
              </Text>
            </View>

            <Text style={{ color: "#666" }}>
              {new Date(shift.actual_start_time).toLocaleString()}
            </Text>

            {/* Photo */}
            {shift.clock_in_photo_url && (
              <Image
                source={{ uri: shift.clock_in_photo_url }}
                style={{
                  height: 120,
                  borderRadius: 8,
                  marginTop: 10,
                }}
              />
            )}

            {/* Location */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <Ionicons name="location-outline" size={18} color="#374151" />
              <Text style={{ marginLeft: 6 }}>
                {shift.clock_in_lat ?? "-"}, {shift.clock_in_long ?? "-"}
              </Text>
            </View>

            {/* Status */}
            <Text style={{ marginTop: 6 }}>
              Status: {shift.status || "Pending"}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}