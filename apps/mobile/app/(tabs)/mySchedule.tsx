// apps/mobile/app/(tabs)/mySchedule.tsx
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useShifts } from "../../hooks/useShifts";

function formatShiftTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatShiftDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function MySchedule() {
  const { user } = useAuth();
  const { data: shifts, isLoading, isError, error } = useShifts(user?.id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-damascus-background">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">Loading schedule…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-damascus-background px-4">
        <Text className="text-center text-damascus-text">Could not load schedule.</Text>
        <Text className="mt-2 text-sm text-gray-500">{String(error?.message ?? error)}</Text>
      </View>
    );
  }

  const list = shifts ?? [];

  return (
    <View className="flex-1 bg-damascus-background">
      <Text className="px-4 pt-4 text-2xl font-bold text-damascus-text">My Schedule</Text>
      <Text className="px-4 pb-2 text-gray-500">Shifts update in real time when created on Web.</Text>
      {list.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-gray-500">No shifts scheduled.</Text>
        </View>
      ) : (
        <FlatList
          className="flex-1 px-4"
          data={list}
          keyExtractor={(item) => item.id ?? String(item.start_time)}
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
              <Text className="font-semibold text-damascus-text">
                {formatShiftDate(item.start_time)}
              </Text>
              <Text className="mt-1 text-gray-600">
                {formatShiftTime(item.start_time)} — {formatShiftTime(item.end_time)}
              </Text>
              <Text className="mt-1 text-xs text-gray-400">{item.role_at_time_of_shift ?? item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
