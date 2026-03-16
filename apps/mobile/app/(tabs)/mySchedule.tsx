import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import WhiteArrow from "../../assets/WhiteArrow.svg";

import { Shift } from "@vak/contract";
import { useAuth } from "../../context/AuthContext";
import { useShifts } from "../../hooks/useShifts";

import SwapModal from "../../src/components/SwapModal";

/* ───────── Helpers ───────── */

const WEEKDAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function buildWeekDays(anchorDate: Date) {
  const days: Date[] = [];

  const dow = anchorDate.getDay();
  const monday = new Date(anchorDate);
  monday.setDate(anchorDate.getDate() - ((dow + 6) % 7));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  return days;
}

function isSameLocalDate(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/* ───────── Screen ───────── */

export default function MySchedule() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: shifts, isLoading, isError, error } = useShifts(user?.id);
  const liveShifts = shifts ?? [];

  const today = useMemo(() => new Date(), []);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);

  const [swapVisible, setSwapVisible] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [selectedShiftRole, setSelectedShiftRole] = useState<string | null>(
    null
  );

  const anchorDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + weekOffset * 7);
    return d;
  }, [today, weekOffset]);

  const weekDays = useMemo(() => buildWeekDays(anchorDate), [anchorDate]);

  const getShiftsForDate = (date: Date) => {
    return liveShifts.filter((s) =>
      isSameLocalDate(new Date(s.start_time), date)
    );
  };

  const weekShiftCount = useMemo(
    () =>
      weekDays.reduce((sum, day) => sum + getShiftsForDate(day).length, 0),
    [weekDays, liveShifts]
  );

  const weekType = useMemo(() => {
    const startOfWeek = weekDays[0];
    const todayWeekStart = buildWeekDays(today)[0];

    if (startOfWeek.getTime() === todayWeekStart.getTime()) return "current";
    if (startOfWeek < todayWeekStart) return "past";

    return "future";
  }, [weekDays, today]);

  const selectedDayShifts = useMemo(
    () => getShiftsForDate(selectedDate),
    [selectedDate, liveShifts]
  );

  const weekShiftPill = useMemo(() => {
    let bg = "bg-gray-200/20";
    let border = "border-gray-300/30";
    let text = "text-gray-400";

    if (weekShiftCount > 0) {
      if (weekType === "current") {
        bg = "bg-brand-success/15";
        border = "border-brand-success/30";
        text = "text-brand-success";
      } else if (weekType === "past") {
        bg = "bg-red-500/15";
        border = "border-red-500/30";
        text = "text-red-400";
      } else if (weekType === "future") {
        bg = "bg-yellow-200/20";
        border = "border-yellow-300/40";
        text = "text-yellow-300";
      }
    }

    return { bg, border, text };
  }, [weekType, weekShiftCount]);

  const changeWeek = (direction: "prev" | "next") => {
    setWeekOffset((prev) => {
      const next = Math.max(
        -4,
        Math.min(4, direction === "prev" ? prev - 1 : prev + 1)
      );

      const newAnchor = new Date(today);
      newAnchor.setDate(today.getDate() + next * 7);

      const newWeekDays = buildWeekDays(newAnchor);

      setSelectedDate(next === 0 ? today : newWeekDays[0]);

      return next;
    });
  };

  /* ───────── Loading ───────── */

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator size="large" color="#063386" />
        <Text className="mt-4 text-gray-500 font-medium">
          Loading schedule...
        </Text>
      </View>
    );
  }

  /* ───────── Error ───────── */

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-4">
        <Text className="text-center text-red-500 font-bold text-lg">
          Error loading schedule
        </Text>

        <Text className="mt-2 text-sm text-gray-500 text-center">
          {String(error?.message ?? error)}
        </Text>
      </View>
    );
  }

  /* ───────── UI ───────── */

  return (
    <View className="flex-1 bg-brand-background">
      {/* Header */}
      <View className="bg-brand-secondary pt-6 pb-16 px-5">
        <View className="flex-row items-center justify-between mb-5">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <WhiteArrow width={16} height={16} />
          </Pressable>

          <Text className="text-white font-bold text-lg tracking-wide mr-36">
            My Schedule
          </Text>
        </View>

        {/* Week Info */}
        <View className="flex-row items-center gap-4 mb-6 mt-3">
          <View
            className={`rounded-full px-5 py-2 border ${
              weekType === "current"
                ? "bg-brand-success/15 border-brand-success/30"
                : weekType === "past"
                ? "bg-red-500/15 border-red-500/30"
                : "bg-yellow-200/20 border-yellow-300/40"
            }`}
          >
            <Text
              className={`text-md font-semibold ${
                weekType === "current"
                  ? "text-brand-success"
                  : weekType === "past"
                  ? "text-red-400"
                  : "text-yellow-300"
              }`}
            >
              {weekType === "current"
                ? "This Week"
                : weekType === "past"
                ? "Past Week"
                : "Upcoming Week"}
            </Text>
          </View>

          <View
            className={`rounded-full px-5 py-2 border ${weekShiftPill.bg} ${weekShiftPill.border}`}
          >
            <Text className={`text-md font-semibold ${weekShiftPill.text}`}>
              {weekShiftCount > 0
                ? `${weekShiftCount} shift${
                    weekShiftCount !== 1 ? "s" : ""
                  } this week`
                : "No shifts this week"}
            </Text>
          </View>
        </View>

        {/* Week Calendar */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => changeWeek("prev")}
            className="w-8 h-8 items-center justify-center mr-1"
          >
            <WhiteArrow width={16} height={16} />
          </Pressable>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 7 }}
            className="flex-1"
          >
            {weekDays.map((day, i) => {
              const isSelected = isSameLocalDate(day, selectedDate);
              const hasShift = getShiftsForDate(day).length > 0;

              return (
                <Pressable
                  key={day.toDateString()}
                  onPress={() => setSelectedDate(day)}
                  className={`items-center rounded-xl min-w-[44px] ${
                    isSelected ? "bg-white" : "bg-white/10"
                  }`}
                  style={{
                    height: 58,
                    paddingTop: 8,
                    paddingBottom: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text
                    className={`text-[10px] font-semibold ${
                      isSelected
                        ? "text-brand-secondary"
                        : "text-white/50"
                    }`}
                  >
                    {WEEKDAY_SHORT[i]}
                  </Text>

                  <Text
                    className={`text-sm font-bold mt-1 ${
                      isSelected
                        ? "text-brand-secondary"
                        : "text-white"
                    }`}
                  >
                    {day.getDate()}
                  </Text>

                  <View
                    style={{
                      height: 8,
                      marginTop: 2,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {hasShift && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#22c55e",
                        }}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={() => changeWeek("next")}
            className="w-8 h-8 items-center justify-center ml-1"
          >
            <WhiteArrow
              width={16}
              height={16}
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </Pressable>
        </View>

        {/* Selected Day */}
        <View className="mt-6">
          <View className="flex-row items-center gap-3">
            <View className="w-2 h-2 rounded-full bg-brand-primary" />

            <Text className="text-md font-bold text-white tracking-widest uppercase">
              {selectedDate.toLocaleDateString([], {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Shifts */}
      <View className="-mt-8 flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 32,
          }}
        >
          <View className="bg-white rounded-xl overflow-hidden shadow-xl">
            {selectedDayShifts.length === 0 ? (
              <View className="px-5 py-10 items-center">
                <Text className="text-base font-bold text-gray-800 text-center">
                  No shifts scheduled
                </Text>

                <Text className="text-xs text-gray-400 text-center mt-2">
                  Enjoy your day off — nothing on the clock!
                </Text>
              </View>
            ) : (
              <View className="px-5 py-5 gap-3">
                {selectedDayShifts.map((shift: Shift, index: number) => {
                  const start = new Date(
                    shift.start_time
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const end = new Date(
                    shift.end_time
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <View key={shift.id}>
                      <View className="bg-gray-50 rounded p-5 border border-gray-400 mb-5">
                        <Text className="text-xl font-bold text-gray-800">
                          {shift.role_at_time_of_shift}
                        </Text>

                        <Text className="text-lg text-gray-600 mt-0.5">
                          {shift.location_id}
                        </Text>

                        <Text className="text-lg text-gray-500 mt-1 font-medium">
                          {start} — {end}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() =>
                          router.push(`/(tabs)/shift/${shift.id}` as any)
                        }
                        className="bg-brand-secondaryLight rounded-2xl py-5 items-center justify-center flex-row gap-2 mt-3"
                      >
                        <Ionicons
                          name="chevron-forward-outline"
                          size={18}
                          color="#ffffff"
                        />

                        <Text className="text-white font-bold text-sm tracking-widest uppercase">
                          View Details
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setSelectedShiftId(shift.id ?? null);
                          setSelectedShiftRole(
                            shift.role_at_time_of_shift
                          );
                          setSwapVisible(true);
                        }}
                        className="bg-blue-500 rounded-2xl py-5 items-center justify-center mt-3"
                      >
                        <Text className="text-white font-bold text-sm tracking-widest uppercase">
                          Request Swap
                        </Text>
                      </Pressable>

                      {index < selectedDayShifts.length - 1 && (
                        <View className="h-px bg-gray-100 mt-3" />
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {selectedShiftId && selectedShiftRole && (
        <SwapModal
          visible={swapVisible}
          shiftId={selectedShiftId}
          role={selectedShiftRole}
          onClose={() => {
            setSwapVisible(false);
            setSelectedShiftId(null);
            setSelectedShiftRole(null);
          }}
        />
      )}
    </View>
  );
}