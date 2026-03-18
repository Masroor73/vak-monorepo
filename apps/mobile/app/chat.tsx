import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Swap = {
  id: string;
  shift_id: string;
  recipient_id: string;
  status: string;
  reason: string | null;
  created_at: string;
};

export default function ChatScreen() {
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
      console.log("Swap load error:", error);
      setLoading(false);
      return;
    }

    setSwaps(data || []);
    setLoading(false);
  }

  function getStatusEmoji(status: string) {
    if (status === "PENDING") return "🟡 Pending";
    if (status === "APPROVED") return "🟢 Approved";
    if (status === "DECLINED") return "🔴 Declined";
    return status;
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="p-4">
      <Text className="text-xl font-bold mb-4">Shift Swap Updates</Text>

      {swaps.length === 0 && (
        <Text className="text-gray-500">No swap requests yet.</Text>
      )}

      {swaps.map((swap) => (
        <View
          key={swap.id}
          className="p-4 border rounded-lg mb-3 bg-white"
        >
          <Text className="font-semibold">
            Shift Swap Request
          </Text>

          <Text className="mt-2">
            Status: {getStatusEmoji(swap.status)}
          </Text>

          {swap.reason && (
            <Text className="text-gray-500 mt-1">
              Reason: {swap.reason}
            </Text>
          )}

          <Text className="text-xs text-gray-400 mt-2">
            {new Date(swap.created_at).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}