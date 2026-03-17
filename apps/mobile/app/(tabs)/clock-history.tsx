import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type ClockHistory = {
  id: string;
  actual_start_time: string;
  clock_in_photo_url: string;
  clock_in_lat: number;
  clock_in_long: number;
  status: string;
};

export default function ClockHistoryScreen() {
  const { user } = useAuth();

  const [history, setHistory] = useState<ClockHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    if (!user) return;

    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("employee_id", user.id)
      .not("actual_start_time", "is", null)
      .order("actual_start_time", { ascending: false });

    if (error) {
      console.log(error);
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
    >
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 20 }}>
        Clock-In History
      </Text>

      {history.length === 0 ? (
        <Text>No clock-ins yet</Text>
      ) : (
        history.map((shift) => (
          <View
            key={shift.id}
            style={{
              backgroundColor: "white",
              padding: 18,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              Clocked In:
            </Text>

            <Text style={{ color: "#666" }}>
              {new Date(shift.actual_start_time).toLocaleString()}
            </Text>

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

            <Text style={{ marginTop: 8 }}>
              Location: {shift.clock_in_lat}, {shift.clock_in_long}
            </Text>

            <Text style={{ marginTop: 6 }}>
              Status: {shift.status || "Pending"}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}