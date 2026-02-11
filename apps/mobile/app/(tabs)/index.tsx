import React, { useState, useMemo } from "react";
import { View, Text, Alert } from "react-native";
import { ShiftStatusCard, PrimaryButton, TextField, StatusBadge } from "@vak/ui";
import { useAuth } from "../../context/AuthContext"; // Importing useAuth to access signOut function
import { useRouter } from "expo-router"; // For navigation if needed
import { MOCK_USER, MOCK_SHIFTS } from "../../constants/mockData";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signOut, session, user } = useAuth(); // Accessing session, user, and signOut function from context
  const router = useRouter(); // Router for navigation (optional if you want to navigate after logout)

  const handleLogout = async () => {
    try {
      await signOut(); // Log the user out

      // Redirect to login page after logout
      router.replace("/(public)/login"); // Adjust path based on your routing setup
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Failed to log out. Please try again.");
    }
  };

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
      hour: "2-digit",
      minute: "2-digit",
    });
    const e = todayShift._end.toLocaleTimeString("en-US", {
      hour: "2-digit",
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

  return (
    <View className="flex-1 bg-damascus-background">
      {/* Header */}
      <View className="bg-brand-primary px-6 pt-8 pb-10">
        <View className="flex-row items-start gap-4">
          <View className="h-12 w-12 rounded-full bg-white/35 items-center justify-center">
            {/* Place holder for actual picture */}
            <Text className="text-white text-xl">👤</Text>
          </View>

          <View className="flex-1">
            <Text className="text-damascus-text text-2xl font-semibold">
              Good morning, {firstName}.
            </Text>

            <View className="mt-5 flex-row items-center gap-3">
              <Text className="text-damascus-text/60 text-xs tracking-widest">
                {topDate}
              </Text>
              <Text className="text-damascus-text/50 text-xs">|</Text>
              {/* Place holder for actual temperature */}
              <Text className="text-damascus-text/60 text-xs">☁︎</Text>
              <Text className="text-damascus-text/60 text-xs">15°C</Text>
            </View>

            <Text className="mt-3 text-damascus-text/70 text-base">
              {summaryText}
            </Text>
          </View>
        </View>
      </View>

      {/* Today's Shift Card */}
      <View className="px-6 pt-8">
        <View className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1">
              <View className="h-2 w-2 rounded-full bg-brand-primary" />
              <Text className="text-xs tracking-widest text-gray-500 font-semibold">
                TODAY&apos;S SHIFT
              </Text>
            </View>

            {/* Clock In button*/}
            <View className="relative shrink-0 min-w-[140px]">
              <View
                pointerEvents="none"
                className="absolute inset-0 bg-brand-primary rounded-[8px] px-6 py-3 items-center justify-center"
              >
                <Text
                  numberOfLines={1}
                  className="text-damascus-text font-semibold"
                >
                  CLOCK IN
                </Text>
              </View>

              <View className="opacity-0">
                <PrimaryButton
                  title="CLOCK IN"
                  variant="primary"
                  onPress={() => Alert.alert("Clock In pressed")}
                  isLoading={false}
                />
              </View>
            </View>
          </View>

          <Text className="mt-4 text-gray-400 text-sm">Not clocked in yet</Text>

          {/* Scheduled sub-card */}
          <View className="mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] tracking-widest text-gray-400 font-semibold">
                SCHEDULED
              </Text>

              <Text className="mt-2 text-xl font-semibold text-gray-800">
                {scheduledTime}
              </Text>
            </View>

            <View className="h-10 w-10 rounded-full bg-brand-primary/30 items-center justify-center">
              <Text className="text-brand-secondary">🕒</Text>
            </View>
          </View>

          {/* ShiftStatusCard */}
          <View className="mt-4">
            <ShiftStatusCard
              title={roleLabel}
              subtitle={`${locationLabel}`}
              status="approved"
            />
          </View>

          {/* Placeholder for incomplete tasks */}
          <View className="mt-4 flex-row items-center gap-2">
            <View className="h-5 w-5 rounded-full border border-gray-300 items-center justify-center">
              <Text className="text-gray-500 text-xs">✓</Text>
            </View>
            <Text className="text-gray-500 text-sm">
              You have 0 incomplete tasks.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
