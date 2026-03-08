import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { View, Text, Pressable, ScrollView, Image, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBadge } from "@vak/ui";
import { MOCK_SHIFTS } from "../../../constants/mockData";
import WhiteArrow from "../../../assets/WhiteArrow.svg";
import { Shift } from "@vak/contract";
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

  const { user } = useAuth(); // ✅ added

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
                  <Text className="text-xs text-gray-400 font-medium">
                    #{shift.id.split("-")[1]}
                  </Text>
                )}
              </View>

              <Text className="text-xl font-bold text-gray-900 mb-4">
                {formatRole(shift.role_at_time_of_shift)}
              </Text>

              <View className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 mb-3">
                <Text className="text-gray-400 text-xs">DATE</Text>
                <Text className="text-gray-800 font-bold">{dateLabel}</Text>
              </View>

              <View className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 mb-3">
                <Text className="text-gray-400 text-xs">TIME</Text>
                <Text className="text-gray-800 font-bold">
                  {startTime} — {endTime} ({duration}h)
                </Text>
              </View>

              <View className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 mb-3">
                <Text className="text-gray-400 text-xs">LOCATION</Text>
                <Text className="text-gray-800 font-bold">
                  {shift.location_id}
                </Text>
              </View>

              {hasBreak && (
                <View className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                  <Text className="text-gray-400 text-xs">BREAK</Text>
                  <Text className="text-gray-800 font-bold">
                    {shift.unpaid_break_minutes} minutes
                  </Text>
                </View>
              )}

            </View>

          </View>

        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-brand-background border-t border-gray-100">

          {canClockIn ? (

            <ClockInButton
              shiftId={shift.id ?? "demo-shift"}
              userId={user?.id ?? ""}
              onDone={() => {
                Alert.alert("Clock-In Successful");
              }}
            />

          ) : (

            <View className="bg-gray-100 rounded-2xl py-5 items-center justify-center flex-row gap-2">
              <Text className="text-base">🔒</Text>
              <Text className="text-gray-400 font-bold text-sm uppercase">

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