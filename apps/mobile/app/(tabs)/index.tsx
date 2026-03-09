import { useMemo } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { MOCK_USER, MOCK_SHIFTS } from "../../constants/mockData";
import { useRouter } from "expo-router";
import { ShiftStatusCard } from "@vak/ui";
import ClockInButton from "../../src/components/ClockInButton";

export default function Index() {
  const router = useRouter();

  const firstName = useMemo(() => {
    const full = MOCK_USER.full_name || "";
    return full.trim().split(" ")[0] || "User";
  }, []);

  const now = new Date();

  const todayShift = useMemo(() => {
    const base = MOCK_SHIFTS[0];
    if (!base) return null;

    const shiftStart = new Date(base.start_time);
    const shiftEnd = new Date(base.end_time);

    const start = new Date(now);
    start.setHours(shiftStart.getHours(), shiftStart.getMinutes(), 0, 0);

    const end = new Date(now);
    end.setHours(shiftEnd.getHours(), shiftEnd.getMinutes(), 0, 0);

    return { ...base, _start: start, _end: end };
  }, []);

  const hasShiftToday = !!todayShift;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <View className="flex-1 bg-brand-background">

      {/* HEADER */}
      <View className="bg-brand-secondary pb-20 px-6 pt-8">
        <Text className="text-white text-xl font-bold mb-2">
          Good Morning {firstName} 👋
        </Text>
        <Text className="text-white/60">
          {now.toDateString()}
        </Text>
      </View>

      {/* SHIFT CARD */}
      <View className="-mt-10 px-4">
        <View className="bg-white rounded-2xl p-5">

          <View className="flex-row justify-between mb-5">
            <Text className="text-gray-500 font-bold">
              Today's Shift
            </Text>

            <Pressable onPress={() => router.push("/(tabs)/mySchedule")}>
              <Text className="text-blue-600 font-semibold">
                View Schedule
              </Text>
            </Pressable>
          </View>

          {hasShiftToday && todayShift ? (
            <>
              <ShiftStatusCard
                title="Morning Shift"
                subtitle={`${formatTime(todayShift._start)} — ${formatTime(
                  todayShift._end
                )}`}
              />

              {/* CLOCK IN SYSTEM */}
              <View
                style={{
                  marginTop: 25,
                  padding: 15,
                  borderRadius: 12,
                  backgroundColor: "#F8FAFC",
                }}
              >
                <ClockInButton
                userId={MOCK_USER.id}
                shiftId={todayShift.id ?? "demo-shift"}
                onDone={() => {
                  Alert.alert("Clock in successful");
                  }}
                  />
              </View>

              <Text style={{ marginTop: 10, color: "#9CA3AF" }}>
                You have 0 incomplete tasks
              </Text>
            </>
          ) : (
            <Text>No shift today</Text>
          )}

        </View>
      </View>
    </View>
  );
}