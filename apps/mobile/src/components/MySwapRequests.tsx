import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Swap = {
  id: string;
  status: string;
  reason: string;
  created_at: string;
};

export default function MySwapRequests() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSwaps();
  }, []);

  async function loadSwaps() {
    if (!user) return;

    const { data, error } = await supabase
      .from("shift_swaps")
      .select("*")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Error loading swaps:", error);
      return;
    }

    setSwaps(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text>Loading swap requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="p-4">
      <Text className="text-xl font-bold mb-4">My Swap Requests</Text>

      {swaps.length === 0 && (
        <Text className="text-gray-500">No swap requests yet.</Text>
      )}

      {swaps.map((swap) => (
        <View
          key={swap.id}
          className="p-4 border rounded-lg mb-3 bg-white"
        >
          <Text className="font-semibold">Reason: {swap.reason}</Text>

          <Text className="mt-1">
            Status:{" "}
            {swap.status === "PENDING" && "🟡 Pending"}
            {swap.status === "APPROVED" && "🟢 Approved"}
            {swap.status === "DECLINED" && "🔴 Declined"}
          </Text>

          <Text className="text-xs text-gray-400 mt-2">
            {new Date(swap.created_at).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}