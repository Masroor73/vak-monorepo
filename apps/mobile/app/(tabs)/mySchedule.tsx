// apps/mobile/app/(tabs)/setAvailability.tsx
import { useState, useMemo, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Switch, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import WhiteArrow from "../../assets/WhiteArrow.svg";
import { Ionicons } from "@expo/vector-icons";

const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE_INCREMENTS = ["00","15","30","45"];

const weekOf = (anchor: Date) => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(anchor);
  d.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7) + i);
  return d;
});
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const formatDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parseTimeLabel = (t: string) => { const [h,m] = t.split(":"); const hour = +h; return { time: `${hour%12||12}:${m}`, ampm: hour>=12?"PM":"AM" }; };

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const isPastDay = (d: Date) => { const t = new Date(); t.setHours(0,0,0,0); const c = new Date(d); c.setHours(0,0,0,0); return c < t; };

const isPastTime = (hour: string, minute: string, date: Date): boolean => {
  if (!isSameDay(date, new Date())) return false;
  const now = new Date();
  const selected = new Date();
  selected.setHours(Number(hour), Number(minute), 0, 0);
  return selected <= now;
};

const validateSchedule = (schedule: DaySchedule): string | null => {
  if (!schedule.fullDay) {
    if (!schedule.isOvernight && timeToMinutes(schedule.end) <= timeToMinutes(schedule.start))
      return "End time must be after start time. Enable overnight shift if this extends past midnight.";
    if (schedule.isOvernight && timeToMinutes(schedule.end) >= timeToMinutes(schedule.start))
      return "For overnight shifts, end time must be earlier than start time (next day).";
  }
  return null;
};

type DaySchedule = { fullDay: boolean; isOvernight: boolean; start: string; end: string; saved: boolean; dbId?: string };
const getDefaultSchedule = (date: Date): DaySchedule => {
  if (!isSameDay(date, new Date()))
    return { fullDay: false, isOvernight: false, start: "09:00", end: "17:00", saved: false };

  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  const extraHours = Math.floor(roundedMinutes / 60);
  const finalMinutes = roundedMinutes % 60;
  const finalHour = now.getHours() + extraHours;
  const start = `${String(finalHour).padStart(2, "0")}:${String(finalMinutes).padStart(2, "0")}`;

  return { fullDay: false, isOvernight: false, start, end: "17:00", saved: false };
};

export default function SetAvailability() {
  const router = useRouter();
  const { user } = useAuth();
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, DaySchedule>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<"start"|"end"|null>(null);
  const [copyTo, setCopyTo] = useState<string[]>([]);
  const [expandApply, setExpandApply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preEditSchedule, setPreEditSchedule] = useState<DaySchedule | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  // ── NEW: tracks whether selected day has an assigned shift ──
  const [shiftAssigned, setShiftAssigned] = useState(false);

  const anchor = useMemo(() => { const d = new Date(today); d.setDate(today.getDate() + weekOffset * 7); return d; }, [today, weekOffset]);
  const week = useMemo(() => weekOf(anchor), [anchor]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 15000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("availabilities")
      .select("id,specific_date,start_time,end_time,is_overnight")
      .eq("user_id", user.id)
      .eq("is_available", true)
      .not("specific_date", "is", null)
      .then(({ data }) => {
        if (data) {
          const scheduleMap: Record<string, DaySchedule> = {};
          data.forEach((record) => {
            const key = record.specific_date;
            scheduleMap[key] = {
              fullDay: record.start_time === "09:00:00" && record.end_time === "17:00:00" && !record.is_overnight,
              isOvernight: record.is_overnight ?? false,
              start: record.start_time?.slice(0,5) ?? "09:00",
              end: record.end_time?.slice(0,5) ?? "17:00",
              saved: true,
              dbId: record.id,
            };
          });
          setAvailabilityMap(scheduleMap);
        }
        setLoading(false);
      });
  }, [user?.id]);

  // ── NEW: check if the selected day has an assigned shift ──
  const checkShiftAssigned = async (date: Date) => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("shifts")
      .select("id")
      .eq("user_id", user.id)
      .eq("shift_date", formatDateKey(date)) // update "shift_date" to match your shifts table column name
      .limit(1);
    setShiftAssigned((data?.length ?? 0) > 0);
  };

  const selectDay = (d: Date) => {
    if (isPastDay(d)) return;
    setSelectedDate(d);
    setPicker(null);
    setCopyTo([]);
    setExpandApply(false);
    setError(null);
    setConfirmClear(false);
    // ── NEW: check shift assignment whenever a day is selected ──
    checkShiftAssigned(d);
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const daySchedule = availabilityMap[selectedDateKey] ?? getDefaultSchedule(selectedDate);
  const isReadOnly = isPastDay(selectedDate) || daySchedule.saved;
  const updateSelectedDay = (partial: Partial<DaySchedule>) => setAvailabilityMap(prev => ({ ...prev, [selectedDateKey]: { ...daySchedule, ...partial } }));
  const toggleCopy = (dateKey: string) => setCopyTo(prev => prev.includes(dateKey) ? prev.filter(x => x !== dateKey) : [...prev, dateKey]);

  const startEdit = () => {
    setPreEditSchedule(daySchedule);
    updateSelectedDay({ saved: false });
    setPicker(null);
    setError(null);
    setConfirmClear(false);
  };

  const cancelEdit = () => {
    updateSelectedDay(preEditSchedule!);
    setPreEditSchedule(null);
    setPicker(null);
    setError(null);
  };

  const submit = async () => {
    if (!user?.id || saving) return;

    if (isPastDay(selectedDate)) { setError("Cannot set availability for a past day."); return; }

    if (daySchedule.fullDay) {
      if (isSameDay(selectedDate, new Date()) && isPastTime("09", "00", selectedDate)) {
        setError("Full day availability has already passed for today.");
        return;
      }
    } else if (!daySchedule.isOvernight) {
      const [endH, endM] = daySchedule.end.split(":");
      if (isPastTime(endH, endM, selectedDate)) {
        setError("The selected availability window has already passed for today.");
        return;
      }
    }

    const validationError = validateSchedule(daySchedule);
    if (validationError) { setError(validationError); return; }
    setError(null);

    const targets = [
      { key: selectedDateKey, date: selectedDate },
      ...copyTo.map(ck => ({ key: ck, date: new Date(ck + "T00:00:00") })),
    ];

    setSaving(true);

    const makeRow = (date: Date) => ({
      user_id: user.id,
      specific_date: formatDateKey(date),
      start_time: daySchedule.fullDay ? "09:00" : daySchedule.start,
      end_time:   daySchedule.fullDay ? "17:00" : daySchedule.end,
      is_available: true,
      is_overnight: daySchedule.fullDay ? false : daySchedule.isOvernight,
    });

    try {
      await Promise.all(targets.map(async ({ key: targetKey, date }) => {
        const existing = availabilityMap[targetKey];
        if (existing?.dbId) {
          await supabase.from("availabilities").update(makeRow(date)).eq("id", existing.dbId).eq("user_id", user.id);
          setAvailabilityMap(prev => ({ ...prev, [targetKey]: { ...daySchedule, saved: true, dbId: prev[targetKey]?.dbId } }));
        } else {
          const { data } = await supabase.from("availabilities").insert(makeRow(date)).select("id").single();
          if (data) setAvailabilityMap(prev => ({ ...prev, [targetKey]: { ...daySchedule, saved: true, dbId: data.id } }));
        }
      }));
    } catch {
      setError("Failed to save availability. Please try again.");
    } finally {
      setSaving(false);
      setPicker(null);
      setCopyTo([]);
      setPreEditSchedule(null);
    }
  };

  const clear = async () => {
    // ── NEW: frontend guard — re-check before actually deleting ──
    if (shiftAssigned) {
      setError("Cannot remove availability — a shift has already been assigned for this day.");
      setConfirmClear(false);
      return;
    }

    if (daySchedule.dbId) {
      // ── NEW: catch DB-level trigger error (covers admin dashboard / direct API calls) ──
      const { error: deleteError } = await supabase
        .from("availabilities")
        .delete()
        .eq("id", daySchedule.dbId)
        .eq("user_id", user!.id);

      if (deleteError) {
        setError("Cannot remove availability — a shift has already been assigned for this day.");
        setConfirmClear(false);
        return; // stop here — do NOT wipe local state
      }
    }

    // Only reaches here if delete succeeded
    setAvailabilityMap(prev => { const updated = { ...prev }; delete updated[selectedDateKey]; return updated; });
    setPicker(null);
    setCopyTo([]);
    setError(null);
    setConfirmClear(false);
  };

  const changeWeek = (dir: 1|-1) => setWeekOffset(prev => {
    const next = Math.max(0, Math.min(4, prev + dir));
    const a = new Date(today); a.setDate(today.getDate() + next * 7);
    selectDay(next === 0 ? today : weekOf(a)[0]);
    return next;
  });

  if (loading) return <View className="flex-1 items-center justify-center bg-brand-secondary"><ActivityIndicator color="#fff" /></View>;

  const submitLabel = copyTo.length > 0 ? `Submit for ${copyTo.length + 1} Days` : "Submit";

  return (
    <ScrollView className="flex-1 bg-brand-background" bounces={false} showsVerticalScrollIndicator={false}>

      {/* Blue header background */}
      <View className="bg-brand-secondary pb-4 h-[300px]">

        {/* Header */}
        <View className="pt-2">
          <View className="flex-row items-center justify-between mb-5">
            <View/>
          </View>

          <View className="mb-5 ml-14">
            <View className={`self-start rounded-full px-3 py-1 border ${weekOffset === 0 ? "bg-brand-success/15 border-brand-success/30" : "bg-yellow-200/20 border-yellow-300/40"}`}>
              <Text className={`text-[10px] font-semibold ${weekOffset === 0 ? "text-brand-success" : "text-yellow-300"}`}>{weekOffset === 0 ? "This Week" : "Upcoming Week"}</Text>
            </View>
          </View>

          {/* Day pill row */}
          <View className="flex-row items-center px-6">
            <Pressable onPress={() => changeWeek(-1)} disabled={weekOffset === 0} className="w-8 h-8 items-center justify-center">
              <WhiteArrow width={14} height={14} style={{ opacity: weekOffset === 0 ? 0.2 : 1 }} />
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }} className="flex-1">
              {week.map((d, i) => {
                const isSelected = isSameDay(d, selectedDate);
                const isSaved = !!availabilityMap[formatDateKey(d)]?.saved;
                const isPast = isPastDay(d);
                return (
                  <Pressable key={i} onPress={() => selectDay(d)} disabled={isPast} style={isPast ? { pointerEvents: "none" } : undefined} className={`items-center py-2 px-2.5 rounded-xl min-w-[40px] ${isSelected ? "bg-white" : isPast ? "bg-white/5" : "bg-white/10"}`}>
                    <Text className={`text-[9px] font-semibold mb-0.5 ${isSelected ? "text-brand-secondary" : isPast ? "text-white/20" : "text-white/50"}`}>{DAYS[i]}</Text>
                    <Text className={`text-sm font-bold ${isSelected ? "text-brand-secondary" : isPast ? "text-white/20" : "text-white"}`}>{d.getDate()}</Text>
                    {isSaved && <View className="w-1.5 h-1.5 rounded-full bg-brand-success mt-0.5" />}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => changeWeek(1)} className="w-8 h-8 items-center justify-center">
              <WhiteArrow width={14} height={14} style={{ transform: [{ rotate: "180deg" }] }} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Card */}
      <View className="px-8 -mt-44">
        <View className="bg-white rounded-2xl shadow-lg shadow-black/20 elevation-8">
          <View className="px-5 pt-4 pb-3 border-b border-gray-100">
            <Text className="text-brand-secondary font-black text-lg">
              {selectedDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </Text>
            <Text className="text-gray-600 font-medium">
              {isPastDay(selectedDate) ? "Past days cannot be edited" : daySchedule.saved ? "Edit or clear availability" : "Submit your availability"}
            </Text>
          </View>

          <View className="p-5" style={{ gap: 12 }}>

            {/* Full Day toggle */}
            <View className="flex-row items-center justify-between px-4 py-3.5 rounded border border-gray-400">
              <View>
                <Text className="text-gray-900 font-extrabold">Full Day Available</Text>
                <Text className="text-gray-700 font-semibold">Available for any time slot</Text>
              </View>
              <Switch value={daySchedule.fullDay} onValueChange={(v) => { if (!isReadOnly) updateSelectedDay({ fullDay: v, isOvernight: false }); }} disabled={isReadOnly} trackColor={{ false: "#e5e7eb", true: "#05CC66" }} thumbColor="#fff" />
            </View>

            {/* Overnight toggle only shown when fullDay is off */}
            {!daySchedule.fullDay && (
              <View className="flex-row items-center justify-between px-4 py-3.5 rounded border border-gray-400">
                <View>
                  <Text className="text-gray-900 font-extrabold">Overnight Shift</Text>
                  <Text className="text-gray-700 font-semibold">Shift extends past midnight</Text>
                </View>
                <Switch value={daySchedule.isOvernight} onValueChange={(v) => { if (!isReadOnly) updateSelectedDay({ isOvernight: v }); }} disabled={isReadOnly} trackColor={{ false: "#e5e7eb", true: "#6366f1" }} thumbColor="#fff" />
              </View>
            )}

            {/* Overnight info banner */}
            {daySchedule.isOvernight && !daySchedule.fullDay && (
              <View className="px-4 py-3 rounded bg-indigo-50 border border-indigo-200 flex-row items-center" style={{ gap: 8 }}>
                <Ionicons name="moon-outline" size={20} color="#4338ca" />
                <Text className="text-indigo-700 font-semibold text-md">Overnight shift, ends the following day</Text>
              </View>
            )}

            {/* Time pickers */}
            {!daySchedule.fullDay && (
              <View style={{ gap: 8 }}>
                <Text className="text-gray-500 font-semibold uppercase">Specific Hours</Text>
                <View className="flex-row gap-3">
                  {(["start","end"] as const).map((field, fieldIndex) => {
                    const { time, ampm } = parseTimeLabel(daySchedule[field]);
                    const isOpen = picker === field;
                    return (
                      <Pressable key={field}
                        onPress={() => { if (!isReadOnly) setPicker(currentPicker => currentPicker === field ? null : field); }}
                        className={`flex-1 rounded p-4 border ${isOpen ? "bg-brand-secondary border-brand-secondary" : "bg-white border-gray-400"}`}>
                        <Text className={`text-[12px] font-semibold tracking-widest uppercase mb-1 ${isOpen ? "text-white" : "text-gray-600"}`}>{fieldIndex === 0 ? "FROM" : "TO"}</Text>
                        <View className="flex-row items-baseline gap-1">
                          <Text className={`font-black text-xl ${isOpen ? "text-white" : "text-brand-secondary"}`}>{time}</Text>
                          <Text className={`font-bold text-xs ${isOpen ? "text-white/90" : "text-gray-600"}`}>{ampm}</Text>
                        </View>
                        {field === "end" && daySchedule.isOvernight && (
                          <Text className={`text-[15px] font-extrabold ${isOpen ? "text-white/70" : "text-indigo-500"}`}>next day</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
                {picker && !isReadOnly && (
                  <View className="bg-gray-50 border border-gray-400 rounded p-3" style={{ gap: 8 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                      {HOURS.map((value) => {
                        const active = daySchedule[picker].split(":")[0] === value;
                        const currentMinute = daySchedule[picker].split(":")[1];
                        const next = `${value}:${currentMinute}`;
                        const { time, ampm } = parseTimeLabel(`${value}:00`);
                        const past = (picker === "end" && daySchedule.isOvernight)
                          ? false
                          : isPastTime(value, currentMinute, selectedDate);
                        return (
                          <Pressable key={value} onPress={() => { if (!past) updateSelectedDay({ [picker]: next }); }} disabled={past}
                            className={`px-3 h-9 items-center justify-center rounded-lg ${active ? "bg-brand-secondary" : past ? "bg-gray-100 border border-gray-100" : "bg-white border border-gray-200"}`}>
                            <Text className={`text-m font-bold ${active ? "text-white" : past ? "text-gray-300" : "text-gray-800"}`}>{time}{ampm}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                      {MINUTE_INCREMENTS.map((val) => {
                        const active = daySchedule[picker].split(":")[1] === val;
                        const currentHour = daySchedule[picker].split(":")[0];
                        const next = `${currentHour}:${val}`;
                        const past = (picker === "end" && daySchedule.isOvernight)
                          ? false
                          : isPastTime(currentHour, val, selectedDate);
                        return (
                          <Pressable key={val} onPress={() => { if (!past) updateSelectedDay({ [picker]: next }); }} disabled={past}
                            className={`w-11 h-9 items-center justify-center rounded-lg ${active ? "bg-brand-secondary" : past ? "bg-gray-100 border border-gray-100" : "bg-white border border-gray-200"}`}>
                            <Text className={`text-m font-bold ${active ? "text-white" : past ? "text-gray-300" : "text-gray-800"}`}>:{val}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Apply to other days */}
            <Pressable
              onPress={() => { if (!isReadOnly) setExpandApply(prev => !prev); }}
              className="flex-row items-center justify-between px-4 py-3.5 rounded border border-gray-400"
            >
              <View>
                <Text className="text-gray-900 font-bold">Apply to Other Days</Text>
                <Text className="text-gray-600 mt-2">
                  {copyTo.length === 0 ? "Copy to multiple days" : `${copyTo.length} day${copyTo.length > 1 ? "s" : ""} selected`}
                </Text>
              </View>
              <View className={`w-7 h-7 rounded items-center justify-center border ${expandApply && !isReadOnly ? "bg-brand-secondary border-brand-secondary" : "border-gray-800"}`}>
                <Text className={`${expandApply && !isReadOnly ? "text-white" : "text-gray-800"}`}>{expandApply && !isReadOnly ? "−" : "+"}</Text>
              </View>
            </Pressable>

            {expandApply && !isReadOnly && (
              <View style={{ gap: 8 }}>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {week.filter(d => !isSameDay(d, selectedDate) && !isPastDay(d) && !availabilityMap[formatDateKey(d)]?.saved).map((d) => {
                    const dateKey = formatDateKey(d);
                    const isChosen = copyTo.includes(dateKey);
                    const dayIndex = week.findIndex(w => isSameDay(w, d));
                    return (
                      <Pressable key={dateKey} onPress={() => toggleCopy(dateKey)}
                        style={{ width: "22%" }}
                        className={`items-center py-2 rounded-sm border ${isChosen ? "bg-brand-secondary border-brand-secondary" : "bg-white border-gray-400"}`}>
                        <Text className={`text-[9px] font-bold ${isChosen ? "text-white/70" : "text-gray-600"}`}>{DAYS[dayIndex]}</Text>
                        <Text className={`text-md font-black ${isChosen ? "text-white" : "text-gray-800"}`}>{d.getDate()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Error banner */}
            {error && (
              <View className="px-4 py-3 rounded bg-red-50 border border-red-300">
                <Text className="text-red-600 font-semibold text-sm">{error}</Text>
              </View>
            )}

            {/* Buttons */}
            {!isPastDay(selectedDate) && (daySchedule.saved && copyTo.length === 0 ? (
              confirmClear ? (
                <View style={{ gap: 8 }} className="mt-2">
                  <Text className="text-gray-700 font-extrabold text-[18px] text-center p-3">Clear availability for this day?</Text>
                  <View className="flex-row gap-3">
                    <Pressable onPress={() => setConfirmClear(false)} className="flex-1 rounded-xl py-4 items-center bg-gray-200">
                      <Text className="text-gray-800 font-black text-medium tracking-widest uppercase">Cancel</Text>
                    </Pressable>
                    <Pressable onPress={clear} className="flex-1 rounded-xl py-4 items-center bg-red-600">
                      <Text className="text-white font-black text-medium tracking-widest uppercase">Confirm</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View className="flex-row gap-3 mt-2">
                  <Pressable onPress={startEdit} className="flex-1 rounded-xl py-4 items-center bg-brand-secondary">
                    <Text className="text-white font-black text-medium tracking-widest uppercase">Edit</Text>
                  </Pressable>
                  {/* ── NEW: disable Clear button and show tooltip if shift is assigned ── */}
                  <Pressable
                    onPress={() => {
                      if (shiftAssigned) {
                        setError("Cannot remove availability — a shift has already been assigned for this day.");
                        return;
                      }
                      setConfirmClear(true);
                    }}
                    className={`flex-1 rounded-xl py-4 items-center ${shiftAssigned ? "bg-red-300" : "bg-red-600"}`}
                  >
                    <Text className="text-white font-black text-medium tracking-widest uppercase">Clear</Text>
                  </Pressable>
                </View>
              )
            ) : (
              <View className="flex-row gap-3 mt-2">
                {preEditSchedule && (
                  <Pressable onPress={cancelEdit} className="flex-1 rounded-xl py-4 items-center bg-gray-200">
                    <Text className="text-gray-800 font-black text-medium tracking-widest uppercase">Cancel</Text>
                  </Pressable>
                )}
                <Pressable onPress={submit} disabled={saving} className="flex-1 rounded-xl py-5 items-center justify-center bg-brand-secondary">
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text numberOfLines={1} adjustsFontSizeToFit className="font-black text-medium tracking-widest uppercase text-white text-center">{submitLabel}</Text>
                  }
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}