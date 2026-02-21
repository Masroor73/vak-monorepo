import { useMemo } from "react";
import { View, Text, Alert, FlatList, Pressable, Button } from "react-native";
import { ShiftStatusCard, PrimaryButton } from "@vak/ui";
import { MOCK_USER, MOCK_SHIFTS } from "../../constants/mockData";
import { useRouter } from "expo-router";

export default function Index() {

  const router = useRouter()

  const firstName = useMemo(() => {
    const full = MOCK_USER.full_name || "";
    return full.trim().split(" ")[0] || "User";
  }, []);

  const now = useMemo(() => new Date(), []);

  const topDate = useMemo(() => {
    const weekday = now
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    const monthDay = now
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .toUpperCase();
    return `${weekday}, ${monthDay}`;
  }, [now]);

  const todayShift = useMemo(() => {
    // Make the first mock shift always be today so the demo always works
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

  const scheduledTime = useMemo(() => {
    if (!todayShift) return "—";
    const s = todayShift._start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const e = todayShift._end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${s} — ${e}`;
  }, [todayShift]);

  const summaryText = hasShiftToday
    ? "You have one shift today."
    : "No shifts today.";

  const roleLabel = useMemo(() => {
    const role = (todayShift as any)?.role_at_time_of_shift;
    if (!role) return "Shift";
    return String(role)
      .toLowerCase()
      .split("_")
      .map((w: string) => w.slice(0, 1).toUpperCase() + w.slice(1))
      .join(" ");
  }, [todayShift]);

  const locationLabel = useMemo(() => {
    return (todayShift as any)?.location_id ?? "damascus-hq";
  }, [todayShift]);

  const upcomingShifts = useMemo(() => {
    const rest = MOCK_SHIFTS.slice(1);

    const mapped = rest.map((s, idx) => {
      const srcStart = new Date(s.start_time);
      const srcEnd = new Date(s.end_time);

      const dayOffset = idx + 1;
      const start = new Date(now);
      start.setDate(now.getDate() + dayOffset);
      start.setHours(srcStart.getHours(), srcStart.getMinutes(), 0, 0);

      const end = new Date(now);
      end.setDate(now.getDate() + dayOffset);
      end.setHours(srcEnd.getHours(), srcEnd.getMinutes(), 0, 0);

      if (end <= start) end.setDate(end.getDate() + 1);

      const prettyDay = start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      const prettyStart = start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const prettyEnd = end.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      const role = String((s as any)?.role_at_time_of_shift ?? "Shift")
        .toLowerCase()
        .split("_")
        .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
        .join(" ");

      const loc = (s as any)?.location_id ?? "damascus-hq";

      return {
        id: s.id ?? `upcoming-${idx}`,
        title: role,
        subtitle: `${prettyDay} • ${prettyStart} - ${prettyEnd} • ${loc}`,
        status: "pending" as const,
      };
    });

    return mapped.slice(0, 3);
  }, [now]);

  const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const getShiftPeriod = (start: Date, end: Date) => {
  const hour = start.getHours();
  if (hour < 12) return "Morning Shift";
  if (hour < 17) return "Afternoon Shift";
  return "Evening Shift";
};

  return (
  <View className="flex-1 bg-damascus-background">
    {/* Header */}
    <View className="bg-brand-secondaryLight px-6 pt-8 pb-10">
      <View className="flex-row items-start gap-4">
        <View className="h-16 w-16 rounded-full bg-white/35 items-center justify-center m-5">
          <Text className="text-white text-xl">👤</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white text-2xl font-semibold">
            Good morning, {firstName}.
          </Text>
          <View className="mt-5 flex-row items-center gap-3">
            <Text className="text-white/60 text-xs tracking-widest">{topDate}</Text>
            <Text className="text-white/60 text-xs">|</Text>
            <Text className="text-white/60 text-xs">☁︎</Text>
            <Text className="text-white/60 text-xs">15°C</Text>
          </View>
          <Text className="mt-3 text-white/70 text-base">
            {todayShift ? "You have one shift today." : "No shifts today."}
          </Text>
        </View>
      </View>
    </View>

    {/* Today's Shift Card */}
    {todayShift && (
      <View className="px-6 pt-8">
        <View className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
          {/* Card Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1">
              <View className="h-2 w-2 rounded-full bg-brand-primary" />
              <Text className="text-xs tracking-widest text-gray-500 font-semibold">
                TODAY&apos;S SHIFT
              </Text>
            </View>
            {/* View Schedule inside card */}
            <Pressable onPress={() => router.push("/(tabs)/mySchedule")}>
              <Text className="text-brand-secondary font-semibold text-sm">
                View Schedule
              </Text>
            </Pressable>
          </View>

          {/* ShiftStatusCard */}
          <View className="mt-4">
            <ShiftStatusCard
              title={getShiftPeriod(todayShift._start, todayShift._end)}
              subtitle={`${formatTime(todayShift._start)} - ${formatTime(todayShift._end)}`}
            />
          </View>

          {/* Clock In Button */}
          <View className="mt-4">
            <Pressable
              onPress={() => Alert.alert("Clock In pressed")}
              className="bg-brand-secondary rounded-[8px] px-6 py-3 items-center justify-center"
            >
              <Text className="text-white font-semibold">CLOCK IN</Text>
            </Pressable>
          </View>

          {/* Incomplete Tasks */}
          <View className="mt-4 flex-row items-center gap-2">
            <View className="h-5 w-5 rounded-full border border-gray-300 items-center justify-center">
              <Text className="text-gray-500 text-xs">✓</Text>
            </View>
            <Text className="text-gray-500 text-sm">You have 0 incomplete tasks.</Text>
          </View>
        </View>
      </View>
    )}
  </View>
);
}