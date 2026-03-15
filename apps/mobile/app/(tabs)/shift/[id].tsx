import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { View, Text, Pressable, ScrollView, Image, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBadge } from "@vak/ui";
import { MOCK_SHIFTS } from "../../../constants/mockData";
import WhiteArrow from "../../../assets/WhiteArrow.svg";
import { Shift } from "@vak/contract";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ClockInButton from "../../../src/components/ClockInButton";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getDurationHours(start: string, end: string) {
  const diff =
    (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60 / 60;
  return diff.toFixed(1);
}

function formatRole(role: Shift["role_at_time_of_shift"]) {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function ShiftDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [showClockIn, setShowClockIn] = useState(false);

  const shift = useMemo(
    () => MOCK_SHIFTS.find((s: Shift) => s.id === id),
    [id]
  );

  if (!shift) {
    return (
      <View className="flex-1 bg-brand-background items-center justify-center px-6">
        <Text className="text-lg font-bold text-gray-800">Shift not found</Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-brand-secondary rounded-2xl px-6 py-3"
        >
          <Text className="text-white font-bold text-sm">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const startTime = formatTime(shift.start_time);
  const endTime = formatTime(shift.end_time);
  const dateLabel = formatDate(shift.start_time);
  const duration = getDurationHours(shift.start_time, shift.end_time);

  const hasBreak = shift.unpaid_break_minutes > 0;
  const canClockIn = shift.status === "PUBLISHED";

  return (
    <View className="flex-1 bg-brand-background">

      {/* HEADER */}
      <View className="bg-brand-secondary pt-6 pb-16 px-5">
        <View className="flex-row items-center mb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <WhiteArrow width={16} height={16} />
          </Pressable>

          <Text className="text-white font-bold text-lg flex-1 text-center mr-10">
            Shift Details
          </Text>
        </View>
      </View>

      <View className="-mt-8 flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white rounded-3xl overflow-hidden shadow-xl">

            <View className="w-full h-56 bg-blue-50 border-b border-gray-100 overflow-hidden">
              <Image
                source={require("../../../assets/Map.png")}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>

            <View className="px-5 pt-5 pb-5">

              <View className="flex-row items-center justify-between mb-3">
                <StatusBadge status={shift.status} />

                {shift.id && (
                  <Text className="text-gray-800 font-medium">
                    #{shift.id.split("-")[1]}
                  </Text>
                )}
              </View>

              <Text className="text-xl font-bold text-gray-900 mb-4">
                {formatRole(shift.role_at_time_of_shift)}
              </Text>

              {/* DATE */}
              <View className="flex-row items-center gap-3 mb-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                <View>
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase">
                    Date
                  </Text>
                  <Text className="text-sm font-bold text-gray-800">
              {/* ── Date ── */}
              <View className="flex-row items-center gap-3 mb-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-400">
                <View className="w-8 h-8 rounded-full bg-brand-secondary/10 items-center justify-center">
                  {/* 📅 → calendar-outline */}
                  <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-[12px] text-gray-700 font-semibold uppercase tracking-wider">
                    Date
                  </Text>
                  <Text className="text-md font-bold text-gray-800 mt-0.5">
                    {dateLabel}
                  </Text>
                </View>
              </View>

              {/* TIME */}
              <View className="flex-row items-center gap-3 mb-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <Ionicons name="time-outline" size={16} color="#3b82f6" />
                <View className="flex-1">
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase">
                    Time
                  </Text>
                  <Text className="text-sm font-bold text-gray-800">
              {/* ── Time ── */}
              <View className="flex-row items-center gap-3 mb-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-400">
                <View className="w-8 h-8 rounded-full bg-brand-secondary/10 items-center justify-center">
                  {/* 🕐 → time-outline */}
                  <Ionicons name="time-outline" size={16} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] text-gray-700 font-semibold uppercase tracking-wider">
                    Time
                  </Text>
                  <Text className="text-md font-bold text-gray-800 mt-0.5">
                    {startTime} — {endTime}
                  </Text>
                </View>
                <Text className="text-xs text-gray-700 font-semibold">
                  {duration}h
                </Text>
              </View>

              {/* LOCATION */}
              <View className="flex-row items-center gap-3 mb-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <Ionicons name="location-outline" size={16} color="#3b82f6" />
                <View>
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase">
                    Location
                  </Text>
                  <Text className="text-sm font-bold text-gray-800">
              {/* ── Location ── */}
              <View className="flex-row items-center gap-3 mb-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-400">
                <View className="w-8 h-8 rounded-full bg-brand-secondary/10 items-center justify-center">
                  {/* 📍 → location-outline */}
                  <Ionicons name="location-outline" size={16} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-[12px] text-gray-700 font-semibold uppercase tracking-wider">
                    Location
                  </Text>
                  <Text className="text-md font-bold text-gray-800 mt-0.5">
                    {shift.location_id}
                  </Text>
                </View>
              </View>

              {hasBreak && (
                <View className="flex-row items-center gap-3 mb-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                  <MaterialCommunityIcons name="coffee-outline" size={16} color="#3b82f6" />
                  <View>
                    <Text className="text-[10px] text-gray-400 font-semibold uppercase">
                      Unpaid Break
                    </Text>
                    <Text className="text-sm font-bold text-gray-800">
                <View className="flex-row items-center gap-3 mb-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-400">
                  <View className="w-8 h-8 rounded-full bg-brand-secondary/10 items-center justify-center">
                    {/* ☕ → coffee-outline (MaterialCommunityIcons) */}
                    <MaterialCommunityIcons name="coffee-outline" size={16} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-[12px] text-gray-700 font-semibold uppercase tracking-wider">
                      Unpaid Break
                    </Text>
                    <Text className="text-md font-bold text-gray-800 mt-0.5">
                      {shift.unpaid_break_minutes} min
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* CLOCK IN AREA */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-brand-background border-t border-gray-100">

          {showClockIn ? (
            <ClockInButton
              shiftId={shift.id!}
              userId={user?.id || ""}
              onDone={() => {
                Alert.alert("Clock-in completed");
                router.back();
              }}
            />
          ) : canClockIn ? (
            <Pressable
              onPress={() => setShowClockIn(true)}
              className="bg-brand-secondary rounded-2xl py-5 items-center justify-center flex-row gap-2"
            >
              <Ionicons name="time-outline" size={18} color="#fff" />
              <Text className="text-white font-bold text-sm tracking-widest uppercase">
                Clock In
              </Text>
            </Pressable>
          ) : (
            <View className="bg-gray-100 rounded-2xl py-5 items-center justify-center flex-row gap-2">
              <Ionicons name="lock-closed" size={18} color="#9ca3af" />
              <Text className="text-gray-400 font-bold text-sm tracking-widest uppercase">
                {shift.status === "COMPLETED"
                  ? "Shift Completed"
                  : shift.status === "VOID"
                  ? "Shift Cancelled"
                  : "Not Yet Published"}
              </Text>
            </View>
          )}

        </View>
      </View>
    </View>
  );
}