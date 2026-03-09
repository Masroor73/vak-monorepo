// apps/mobile/app/(tabs)/mySchedule.tsx

import { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MOCK_SHIFTS } from "../../constants/mockData";
import WhiteArrow from "../../assets/WhiteArrow.svg";
import { Shift } from "@vak/contract";
import SwapModal from "@/src/components/SwapModal";

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

function getShiftsForDate(date: Date) {
  return MOCK_SHIFTS.filter((s) =>
    isSameLocalDate(new Date(s.start_time), date)
  );
}

/* ───────── Screen ───────── */

export default function MySchedule() {
  const router = useRouter();

  const today = useMemo(() => new Date(), []);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);

  /* Swap Modal State */

  const [swapVisible, setSwapVisible] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const anchorDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + weekOffset * 7);
    return d;
  }, [today, weekOffset]);

  const weekDays = useMemo(() => buildWeekDays(anchorDate), [anchorDate]);

  const selectedDayShifts = useMemo(
    () => getShiftsForDate(selectedDate),
    [selectedDate]
  );

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
                  className={`items-center py-2 px-3 rounded-2xl min-w-[44px] ${
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

      </View>

      {/* SHIFT LIST */}

      <View className="-mt-8 flex-1">

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 32,
          }}
        >

          <View className="bg-white rounded-3xl overflow-hidden shadow-xl">

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

                {selectedDayShifts.map((shift: Shift) => {

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

                      <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">

                        <Text className="text-base font-bold text-gray-800">
                          {shift.role_at_time_of_shift}
                        </Text>

                        <Text className="text-sm text-gray-500 mt-1 font-medium">
                          {start} — {end}
                        </Text>

                      </View>

                      {/* VIEW DETAILS */}

                      <Pressable
                        onPress={() =>
                          router.push(`/(tabs)/shift/${shift.id}`)
                        }
                        className="bg-brand-secondaryLight rounded-2xl py-5 items-center justify-center mt-3"
                      >

                        <Text className="text-white font-bold text-sm tracking-widest uppercase">
                          View Details
                        </Text>

                      </Pressable>

                      {/* REQUEST SWAP */}

                      <Pressable
                        onPress={() => {
                          setSelectedShiftId(shift.id ?? null);
                          setSwapVisible(true);
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

      {/* SWAP MODAL */}

      <SwapModal
        visible={swapVisible}
        onClose={() => setSwapVisible(false)}
        shiftId={selectedShiftId || ""}
      />

    </View>
  );
}