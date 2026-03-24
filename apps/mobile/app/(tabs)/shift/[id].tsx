import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBadge } from "@vak/ui";
import WhiteArrow from "../../../assets/WhiteArrow.svg";
import { Shift } from "@vak/contract";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ClockInButton from "../../../src/components/ClockInButton";
import ClockOutButton from "../../../src/components/ClockOutButton";
import { supabase } from "../../../lib/supabase";

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
  if (!role) return "Shift";

  return String(role)
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function ShiftDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [showClockIn, setShowClockIn] = useState(false);
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShift = async () => {
      if (!id) {
        setShift(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("shifts")
          .select("*")
          .eq("id", String(id))
          .single();

        if (error || !data) {
          console.log("Shift details load error:", error);
          setShift(null);
          return;
        }

        setShift(data as Shift);
      } catch (err) {
        console.error("Unexpected shift load error:", err);
        setShift(null);
      } finally {
        setLoading(false);
      }
    };

    loadShift();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-brand-background items-center justify-center px-6">
        <ActivityIndicator size="large" color="#063386" />

        <Text className="mt-4 text-gray-500 font-medium">
          Loading shift...
        </Text>
      </View>
    );
  }

  if (!shift) {
    return (
      <View className="flex-1 bg-brand-background items-center justify-center px-6">
        <Text className="text-lg font-bold text-gray-800">
          Shift not found
        </Text>

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

  const hasBreak = Number(shift.unpaid_break_minutes ?? 0) > 0;

  console.log("SHIFT DATA:", shift);
  console.log("UNPAID BREAK:", shift?.unpaid_break_minutes);

  const canClockIn = shift.status === "PUBLISHED";
  const isClockedIn = shift.actual_start_time && !(shift as any).clock_out_time;

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
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 200,
          }}
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
                  <Text className="text-lg text-gray-800 font-medium">
                    #{String(shift.id).split("-")[1] ?? shift.id}
                  </Text>
                )}
              </View>

              <Text className="text-xl font-bold text-gray-900 mb-4">
                {formatRole(shift.role_at_time_of_shift)}
              </Text>

              <View className="flex-row items-center gap-3 mb-4 bg-gray-50 rounded-lg px-4 py-3 border border-gray-400">
                <Ionicons name="calendar-outline" size={20} color="#3b82f6" />

                <View>
                  <Text className="text-[13px] text-gray-600 font-semibold uppercase">
                    Date
                  </Text>

                  <Text className="text-md font-bold text-gray-800">
                    {dateLabel}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3 mb-4 bg-gray-50 rounded-lg px-4 py-3 border border-gray-400">
                <Ionicons name="time-outline" size={20} color="#3b82f6" />

                <View className="flex-1">
                  <Text className="text-[13px] text-gray-600 font-semibold uppercase">
                    Time
                  </Text>

                  <Text className="text-md font-bold text-gray-800">
                    {startTime} — {endTime}
                  </Text>
                </View>

                <Text className="text-lg text-gray-800 font-semibold">
                  {duration}h
                </Text>
              </View>

              <View className="flex-row items-center gap-3 mb-4 bg-gray-50 rounded-lg px-4 py-3 border border-gray-400">
                <Ionicons name="location-outline" size={20} color="#3b82f6" />

                <View>
                  <Text className="text-[13px] text-gray-600 font-semibold uppercase">
                    Location
                  </Text>

                  <Text className="text-md font-bold text-gray-800">
                    {shift.location_id}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3 mb-4 bg-gray-50 rounded-lg px-4 py-3 border border-gray-400">
                <MaterialCommunityIcons
                  name="coffee-outline"
                  size={20}
                  color="#3b82f6"
                />

                <View>
                  <Text className="text-[13px] text-gray-600 font-semibold uppercase">
                    Unpaid Break
                  </Text>

                  <Text className="text-md font-bold text-gray-800">
                    {shift.unpaid_break_minutes ?? 45} min
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

       <View className="px-4 pb-6 pt-3">
  {shift && !shift.actual_start_time ? (
    <ClockInButton
      shiftId={String(shift.id)}
      userId={user?.id || ""}
      onDone={() => {
        Alert.alert("Clock-in completed");

        setShift((prev: any) => ({
          ...prev,
          actual_start_time: new Date().toISOString(),
        }));
      }}
    />
  ) : shift && !shift.actual_end_time ? (
    <ClockOutButton
      shiftId={String(shift.id)}
      onDone={() => {
        Alert.alert("Clock-out completed");

        setShift((prev: any) => ({
          ...prev,
          actual_end_time: new Date().toISOString(),
        }));
      }}
    />
  ) : (
    <Text className="text-green-600 font-bold text-center">
      Shift completed
    </Text>
  )}
</View>
      </View>
    </View>
  );
}