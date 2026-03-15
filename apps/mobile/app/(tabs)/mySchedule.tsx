import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import WhiteArrow from "../../assets/WhiteArrow.svg";
import { Shift } from "@vak/contract";
import { useAuth } from "../../context/AuthContext";
import { useShifts } from "../../hooks/useShifts";

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
    () => weekDays.reduce((sum, day) => sum + getShiftsForDate(day).length, 0),
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

  return (
    <View className="flex-1 bg-brand-background">
      {/* HEADER */}
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

        {/* WEEK SELECTOR */}
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
            contentContainerStyle={{ gap: 6 }}
            className="flex-1"
          >
            {weekDays.map((day, i) => {
              const isSelected = isSameLocalDate(day, selectedDate);

              return (
                <Pressable
                  key={day.toDateString()}
                  onPress={() => setSelectedDate(day)}
                  className={`items-center py-2 px-3 rounded-xl min-w-[44px] ${
                    isSelected ? "bg-white" : "bg-white/10"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-semibold mb-1 ${
                      isSelected ? "text-brand-secondary" : "text-white/50"
                    }`}
                  >
                    {WEEKDAY_SHORT[i]}
                  </Text>

                  <Text
                    className={`text-sm font-bold ${
                      isSelected ? "text-brand-secondary" : "text-white"
                    }`}
                  >
                    {day.getDate()}
                  </Text>
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

        {/* Selected Date Label */}
        <View className="mt-7">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-brand-primary" />
            <Text className="text-s font-bold text-white tracking-widest uppercase">
              {selectedDate.toLocaleDateString([], {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>

          <View
            className={`mt-3 self-start rounded-full px-3 py-1 border ${weekShiftPill.bg} ${weekShiftPill.border}`}
          >
            <Text className={`text-xs font-semibold ${weekShiftPill.text}`}>
              {weekShiftCount} {weekShiftCount === 1 ? "shift" : "shifts"} this
              week
            </Text>
          </View>
        </View>
      </View>

      {/* Shift Sheet */}
      <View className="-mt-9 flex-1 px-2">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 32,
          }}
        >
          <View className="bg-white rounded overflow-hidden shadow-xl">
            {selectedDayShifts.length === 0 ? (
              <View className="px-5 py-10 items-center">
                <Text className="text-md font-bold text-gray-800 text-center">
                  No shifts scheduled
                </Text>
                <Text className="text-lg text-gray-600 text-center mt-2 tracking-wide">
                  Enjoy your day off.. nothing on the clock!
                </Text>
              </View>
            ) : (
              <View className="px-5 py-5 gap-5">
                {selectedDayShifts.map((shift: Shift) => {
                  const start = new Date(shift.start_time).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  const end = new Date(shift.end_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <View key={shift.id}>
                      <View className="bg-gray-50 rounded-xl p-4 border border-gray-400">
                        <Text className="text-base font-bold text-gray-800">
                          {shift.role_at_time_of_shift}
                        </Text>

                        <Text className="text-s text-gray-700 mt-0.5">
                          {shift.location_id}
                        </Text>

                        <Text className="text-sm text-gray-500 mt-1 font-medium">
                          {start} — {end}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => router.push(`/(tabs)/shift/${shift.id}` as any)}
                        className="bg-brand-secondaryLight rounded-xl py-5 items-center justify-center mt-5"
>
                        <Text className="text-white font-bold text-sm tracking-widest uppercase">
                          View Details
  </Text>
</Pressable>

                      <Pressable
                        onPress={() => {
                          // placeholder until swap modal is wired back in
                        }}
                        className="bg-blue-500 rounded-2xl py-5 items-center justify-center mt-2"
                      >
                        <Text className="text-white font-bold text-sm tracking-widest uppercase">
                          Request Swap
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}