// apps/mobile/app/(tabs)/setAvailability.tsx
import { useState, useMemo, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Switch, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import WhiteArrow from "../../assets/WhiteArrow.svg";

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

// ── Validation helpers ────────────────────────────────────────────────────────
const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const isPastDay = (d: Date) => { const t = new Date(); t.setHours(0,0,0,0); const c = new Date(d); c.setHours(0,0,0,0); return c < t; };

const validateSchedule = (schedule: DaySchedule): string | null => {
  if (!schedule.fullDay && timeToMinutes(schedule.end) <= timeToMinutes(schedule.start)) {
    return "End time must be after start time.";
  }
  return null;
};
// ─────────────────────────────────────────────────────────────────────────────

type DaySchedule = { fullDay: boolean; start: string; end: string; saved: boolean; dbId?: string };
const DEFAULT_SCHEDULE: DaySchedule = { fullDay: false, start: "09:00", end: "17:00", saved: false };

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

  const anchor = useMemo(() => { const d = new Date(today); d.setDate(today.getDate() + weekOffset * 7); return d; }, [today, weekOffset]);
  const week = useMemo(() => weekOf(anchor), [anchor]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("availabilities").select("id,day_of_week,start_time,end_time").eq("user_id", user.id).eq("is_available", true)
      .then(({ data }) => {
        if (data) {
          const scheduleMap: Record<string, DaySchedule> = {};
          data.forEach((record) => {
            const d = new Date(today);
            d.setDate(today.getDate() + (record.day_of_week - today.getDay() + 7) % 7);
            const key = formatDateKey(d);
            scheduleMap[key] = { fullDay: record.start_time === "09:00:00" && record.end_time === "17:00:00", start: record.start_time?.slice(0,5) ?? "09:00", end: record.end_time?.slice(0,5) ?? "17:00", saved: true, dbId: record.id };
          });
          setAvailabilityMap(scheduleMap);
        }
        setLoading(false);
      });
  }, [user?.id]);

  // Clear error when switching days
  const selectDay = (d: Date) => {
    if (isPastDay(d)) return;
    setSelectedDate(d);
    setPicker(null);
    setCopyTo([]);
    setExpandApply(false);
    setError(null);
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const daySchedule = availabilityMap[selectedDateKey] ?? DEFAULT_SCHEDULE;
  const isReadOnly = isPastDay(selectedDate) || daySchedule.saved;
  const updateSelectedDay = (partial: Partial<DaySchedule>) => setAvailabilityMap(prev => ({ ...prev, [selectedDateKey]: { ...daySchedule, ...partial } }));
  const toggleCopy = (dateKey: string) => setCopyTo(prev => prev.includes(dateKey) ? prev.filter(x => x !== dateKey) : [...prev, dateKey]);

  const startEdit = () => {
    setPreEditSchedule(daySchedule);
    updateSelectedDay({ saved: false });
    setPicker(null);
    setError(null);
  };

  const cancelEdit = () => {
    updateSelectedDay(preEditSchedule!);
    setPreEditSchedule(null);
    setPicker(null);
    setError(null);
  };

  const submit = async () => {
    if (!user?.id || saving) return;

    // ── Validate time range ───────────────────────────────────────────────────
    if (isPastDay(selectedDate)) { setError("Cannot set availability for a past day."); return; }
    const validationError = validateSchedule(daySchedule);
    if (validationError) { setError(validationError); return; }
    setError(null);
    // ─────────────────────────────────────────────────────────────────────────

    const start = timeToMinutes(daySchedule.fullDay ? "09:00" : daySchedule.start);
    const end   = timeToMinutes(daySchedule.fullDay ? "17:00" : daySchedule.end);

    // Check for overlaps in local state across all target days
    const targets = [
      { key: selectedDateKey, date: selectedDate },
      ...copyTo.map(ck => ({ key: ck, date: new Date(ck + "T00:00:00") })),
    ];
    const overlappingDay = targets.find(({ key }) => {
      const existing = availabilityMap[key];
      if (existing?.dbId) return false;
      return Object.entries(availabilityMap).some(([k, v]) => {
        if (k === key || k === selectedDateKey || !v.dbId) return false;
        const s = timeToMinutes(v.start);
        const e = timeToMinutes(v.end);
        return start < e && end > s;
      });
    });
    if (overlappingDay) {
      setError(`Overlapping availability on ${overlappingDay.date.toLocaleDateString([], { weekday: "long" })}.`);
      return;
    }

    setSaving(true);

    const makeRow = (date: Date) => ({
      user_id: user.id,
      day_of_week: date.getDay(),
      start_time: daySchedule.fullDay ? "09:00" : daySchedule.start,
      end_time:   daySchedule.fullDay ? "17:00" : daySchedule.end,
      is_available: true,
    });

    for (const { key: targetKey, date } of targets) {
      const existing = availabilityMap[targetKey];
      if (existing?.dbId) {
        await supabase.from("availabilities").update(makeRow(date)).eq("id", existing.dbId).eq("user_id", user.id);
        setAvailabilityMap(prev => ({ ...prev, [targetKey]: { ...daySchedule, saved: true, dbId: prev[targetKey]?.dbId } }));
      } else {
        const { data } = await supabase.from("availabilities").insert(makeRow(date)).select("id").single();
        if (data) setAvailabilityMap(prev => ({ ...prev, [targetKey]: { ...daySchedule, saved: true, dbId: data.id } }));
      }
    }

    setSaving(false);
    setPicker(null);
    setCopyTo([]);
    setPreEditSchedule(null);
  };

  const clear = async () => {
    if (daySchedule.dbId) {
      await supabase
        .from("availabilities")
        .delete()
        .eq("id", daySchedule.dbId)
        .eq("user_id", user!.id);
    }
    setAvailabilityMap(prev => { const updated = { ...prev }; delete updated[selectedDateKey]; return updated; });
    setPicker(null);
    setCopyTo([]);
    setError(null);
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
        <View className="pt-10">
          <View className="flex-row items-center justify-between mb-5">
            <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-white/10 items-center justify-center ml-5">
              <WhiteArrow width={14} height={14} />
            </Pressable>
            <Text className="text-white font-bold text-base tracking-wide mr-10">Set Availability</Text>
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

      {/* Card — natural height, no flex-1 */}
      <View className="px-8 -mt-28 pb-8">
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

            {/* Full day toggle */}
            <View className="flex-row items-center justify-between px-4 py-3.5 rounded border border-gray-400">
              <View>
                <Text className="text-gray-900 font-extrabold">Full Day Available</Text>
                <Text className="text-gray-700 font-semibold">Available for any time slot</Text>
              </View>
              <Switch value={daySchedule.fullDay} onValueChange={(v) => { if (!isReadOnly) updateSelectedDay({ fullDay: v }); }} disabled={isReadOnly} trackColor={{ false: "#e5e7eb", true: "#05CC66" }} thumbColor="#fff" />
            </View>

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
                      </Pressable>
                    );
                  })}
                </View>
                {picker && !isReadOnly && (
                  <View className="bg-gray-50 border border-gray-400 rounded p-3" style={{ gap: 8 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                      {HOURS.map((value) => {
                        const active = daySchedule[picker].split(":")[0] === value;
                        const next = `${value}:${daySchedule[picker].split(":")[1]}`;
                        const { time, ampm } = parseTimeLabel(`${value}:00`);
                        return (
                          <Pressable key={value} onPress={() => updateSelectedDay({ [picker]: next })} className={`px-3 h-9 items-center justify-center rounded-lg ${active ? "bg-brand-secondary" : "bg-white border border-gray-200"}`}>
                            <Text className={`text-m font-bold ${active ? "text-white" : "text-gray-800"}`}>{time}{ampm}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                      {MINUTE_INCREMENTS.map((val) => {
                        const active = daySchedule[picker].split(":")[1] === val;
                        const next = `${daySchedule[picker].split(":")[0]}:${val}`;
                        return (
                          <Pressable key={val} onPress={() => updateSelectedDay({ [picker]: next })} className={`w-11 h-9 items-center justify-center rounded-lg ${active ? "bg-brand-secondary" : "bg-white border border-gray-200"}`}>
                            <Text className={`text-m font-bold ${active ? "text-white" : "text-gray-800"}`}>:{val}</Text>
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

            {/* ── Error banner ─────────────────────────────────────────────── */}
            {error && (
              <View className="px-4 py-3 rounded bg-red-50 border border-red-300">
                <Text className="text-red-600 font-semibold text-sm">{error}</Text>
              </View>
            )}

            {/* Buttons */}
            {!isPastDay(selectedDate) && (daySchedule.saved && copyTo.length === 0 ? (
              <View className="flex-row gap-3 mt-2">
                <Pressable onPress={startEdit} className="flex-1 rounded-xl py-4 items-center bg-brand-secondary">
                  <Text className="text-white font-black text-medium tracking-widest uppercase">Edit</Text>
                </Pressable>
                <Pressable onPress={clear} className="flex-1 rounded-xl py-4 items-center bg-red-600">
                  <Text className="text-white font-black text-medium tracking-widest uppercase">Clear</Text>
                </Pressable>
              </View>
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