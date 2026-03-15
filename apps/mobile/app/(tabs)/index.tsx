import { useMemo } from "react";
import { View, Text, Alert, Pressable, ScrollView } from "react-native";
import { MOCK_USER, MOCK_SHIFTS } from "../../constants/mockData";
import { useRouter } from "expo-router";
import { ShiftStatusCard } from "@vak/ui";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ClockInButton from "../../src/components/ClockInButton";

export default function Index() {
  const router = useRouter();
  const now = new Date();

  const firstName = useMemo(() => {
    const full = MOCK_USER.full_name || "";
    return full.trim().split(" ")[0] || "User";
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const topDate = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const todayShift = useMemo(() => {
    const base = MOCK_SHIFTS[0];
    if (!base) return null;

    const shiftStart = new Date(base.start_time);
    const shiftEnd = new Date(base.end_time);

    const start = new Date();
    start.setHours(shiftStart.getHours(), shiftStart.getMinutes(), 0, 0);

    const end = new Date();
    end.setHours(shiftEnd.getHours(), shiftEnd.getMinutes(), 0, 0);

    return { ...base, _start: start, _end: end };
  }, []);

  const hasShiftToday = !!todayShift;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <ScrollView className="flex-1 bg-brand-background">
      <View className="bg-brand-secondary pb-[100px] overflow-hidden">
        <View
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "#1a3278",
            opacity: 0.55,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 30,
            left: -30,
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: "#162550",
            opacity: 0.7,
          }}
        />

        <View className="px-6 pt-7">
          <View className="flex-row items-center space-x-5 mb-[18px] p-2">
            <View className="w-24 h-24 rounded-full bg-brand-primary/10 border-[1.5px] border-brand-primary border-white/22 items-center justify-center mr-2">
              <Ionicons name="person" size={36} color="#62CCEF" />
            </View>

            <View className="flex-1">
              <Text className="text-[22px] font-semibold text-white/45 tracking-[1.3px] uppercase mb-2 ml-3">
                {getGreeting()}
              </Text>

              <View className="flex-row items-center ml-3">
                <Text className="text-[21px] font-bold text-white tracking-[0.2px]">
                  {firstName}
                </Text>
                <MaterialCommunityIcons
                  name="hand-wave"
                  size={22}
                  color="#eab308"
                  style={{ marginLeft: 6 }}
                />
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-5 ml-2">
            <View className="flex-row items-center bg-white/10 border border-white/10 rounded-[20px] px-3 py-2 gap-1.5">
              <Ionicons name="calendar-outline" size={12} color="red" />
              <Text className="text-white/65 text-[11px] font-medium">
                {topDate}
              </Text>
            </View>

            <View className="flex-row items-center bg-white/10 border border-white/10 rounded-[20px] px-3 py-2 gap-1.5">
              <Ionicons name="cloud" size={12} color="white" />
              <Text className="text-white/65 text-[11px] font-medium">
                15°C
              </Text>
            </View>

            <View
              className={`flex-row items-center gap-1.5 rounded-[20px] px-3 py-1.5 border ${
                hasShiftToday
                  ? "bg-brand-success/15 border-brand-success/30"
                  : "bg-white/10 border-white/10"
              }`}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: hasShiftToday
                    ? "#4ade80"
                    : "rgba(255,255,255,0.35)",
                }}
              />
              <Text
                className={`text-[11px] font-semibold ${
                  hasShiftToday ? "text-brand-success" : "text-white/65"
                }`}
              >
                {hasShiftToday ? "1 shift today" : "No shifts"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="-mt-16 px-4">
        <View
          className="bg-white rounded px-5 pt-5 pb-5 mb-3"
          style={{
            shadowColor: "#0d1b3e",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.1,
            shadowRadius: 18,
            elevation: 6,
          }}
        >
          <Pressable onPress={() => router.push("/(tabs)/mySchedule")}>
            <Text className="text-blue-600 font-semibold">View Schedule</Text>
          </Pressable>

          {hasShiftToday && todayShift ? (
            <>
              <ShiftStatusCard
                title="Morning Shift"
                subtitle={`${formatTime(todayShift._start)} — ${formatTime(
                  todayShift._end
                )}`}
              />

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
                  shiftId={todayShift.id || "demo-shift"}
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
            <View className="items-center py-6 gap-3">
              <View className="w-24 h-24 rounded-full bg-yellow-50 items-center justify-center mb-1">
                <Ionicons name="moon-outline" size={35} color="#eab308" />
              </View>

              <Text className="text-[15px] font-bold text-gray-800">
                No shift today
              </Text>

              <Text className="text-[12px] text-gray-400 text-center px-6">
                You're off the clock — enjoy your time off!
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}