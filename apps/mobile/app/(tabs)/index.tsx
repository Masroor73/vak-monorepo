import { useMemo } from "react";
import { View, Text, Alert, Pressable, } from "react-native";
import { MOCK_USER, MOCK_SHIFTS } from "../../constants/mockData";
import { useRouter } from "expo-router";
import { ShiftStatusCard } from "@vak/ui";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function Index() {
  const router = useRouter();

  const firstName = useMemo(() => {
    const full = MOCK_USER.full_name || "";
    return full.trim().split(" ")[0] || "User";
  }, []);

  const now = useMemo(() => new Date(), []);

  const topDate = useMemo(() => {
    const weekday = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const monthDay = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
    return `${weekday}, ${monthDay}`;
  }, [now]);

  const todayShift = useMemo(() => {
    const base = MOCK_SHIFTS[0];
    if (!base) return null;

    const shiftStart = new Date(base.start_time);
    const shiftEnd = new Date(base.end_time);

    const start = new Date(now);
    start.setHours(shiftStart.getHours(), shiftStart.getMinutes(), 0, 0);

    const end = new Date(now);
    end.setHours(shiftEnd.getHours(), shiftEnd.getMinutes(), 0, 0);

    if (end <= start) end.setDate(end.getDate() + 1);

    return { ...base, _start: start, _end: end };
  }, [now]);

  const hasShiftToday = !!todayShift;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const getShiftPeriod = (start: Date) => {
    const hour = start.getHours();
    if (hour < 12) return "Morning Shift";
    if (hour < 17) return "Afternoon Shift";
    return "Evening Shift";
  };

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View className="flex-1 bg-brand-background">
      {/* ── Hero Header ── */}
      <View className="bg-brand-secondary pb-[100px] overflow-hidden">
        {/* Layered shapes */}
        <View style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: "#1a3278", opacity: 0.55 }} />
        <View style={{ position: "absolute", bottom: 30, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "#162550", opacity: 0.7 }} />

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
                <MaterialCommunityIcons name="hand-wave" size={22} color="#eab308" style={{ marginLeft: 6 }} />
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-5 ml-2">
            <View className="flex-row items-center bg-white/10 border border-white/10 rounded-[20px] px-3 py-2 gap-1.5">
              <Ionicons name="calendar-outline" size={12} color="red" />
              <Text className="text-white/65 text-[11px] font-medium">{topDate}</Text>
            </View>
            <View className="flex-row items-center bg-white/10 border border-white/10 rounded-[20px] px-3 py-2 gap-1.5">
              <Ionicons name="cloud" size={12} color="white" />
              <Text className="text-white/65 text-[11px] font-medium">15°C</Text>
            </View>
            <View className={`flex-row items-center gap-1.5 rounded-[20px] px-3 py-1.5 border ${hasShiftToday ? "bg-brand-success/15 border-brand-success/30" : "bg-white/10 border-white/10"}`}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: hasShiftToday ? "#4ade80" : "rgba(255,255,255,0.35)" }} />
              <Text className={`text-[11px] font-semibold ${hasShiftToday ? "text-brand-success" : "text-white/65"}`}>
                {hasShiftToday ? "1 shift today" : "No shifts"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Card over header ── */}
      <View className="-mt-12 px-4">
        <View className="bg-white rounded-xl px-5 pt-5 pb-5 mb-3" style={{ shadowColor: "#0d1b3e", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 18, elevation: 6 }}>

          {/* Card header */}
          <View className="flex-row items-center justify-between mb-6 mt-2">
            <View className="flex-row items-center gap-2">
              <View className={`w-3 h-3 mr-2 rounded-[23px] ${hasShiftToday ? "bg-brand-success" : "bg-gray-300"}`} />
              <Text className="text-[12px] font-bold text-gray-500 tracking-[1.1px] uppercase">
                Today's Shift
              </Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/mySchedule")}>
              <Text className="text-brand-secondaryLight text-[15px] font-semibold">View Schedule </Text>
            </Pressable>
          </View>

          {hasShiftToday && todayShift ? (
            /* ── HAS SHIFT ── */
            <>
              {/* ShiftStatusCard */}
              <ShiftStatusCard
                title={getShiftPeriod(todayShift._start)}
                subtitle={`${formatTime(todayShift._start)} — ${formatTime(todayShift._end)}`}
              />

              {/* Clock In Button */}
              <View className="pr-24 pl-24">
                <Pressable
                  onPress={() => Alert.alert("Clock In pressed")}
                  className="bg-brand-secondaryLight rounded-[12px] px-6 py-5 items-center justify-center"
                >
                  <Text className="text-white font-semibold">CLOCK IN</Text>
                </Pressable>
              </View>

              {/* Task note */}
              <View>
                <View className="flex-row items-center gap-1.5 pt-4">
                  <View className="w-4.5 h-4.5 rounded-full bg-green-100 items-center justify-center">
                    <Text className="text-[10px] text-brand-success">✓</Text>
                  </View>
                  <Text className="text-[12px] text-gray-400">You have 0 incomplete tasks</Text>
                </View>
              </View>
            </>
          ) : (
            /* ── NO SHIFT ── */
            <View className="items-center py-6 gap-3">
              <View className="w-24 h-24 rounded-full bg-yellow-50 items-center justify-center mb-1">
                {/* 🌙 → moon-outline */}
                <Ionicons name="moon-outline" size={35} color="#eab308" />
              </View>
              <Text className="text-[15px] font-bold text-gray-800">No shift today</Text>
              <Text className="text-[12px] text-gray-400 text-center px-6">
                You're off the clock — enjoy your time off!
              </Text>
            </View>
          )}

        </View>
      </View>
    </View>
  );
}