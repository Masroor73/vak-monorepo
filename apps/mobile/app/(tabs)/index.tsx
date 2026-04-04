import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, GestureResponderEvent,} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ClockInButton from "../../src/components/ClockInButton";
import ClockOutButton from "../../src/components/ClockOutButton";
import { useAuth } from "../../context/AuthContext";
import { useShifts } from "../../hooks/useShifts";
import { supabase } from "../../lib/supabase";
import {
  registerForPushNotifications,
  scheduleBreakReminder,
  cancelBreakReminder,
  scheduleBreakEnforcement,
  cancelBreakEnforcement,
} from "../../src/utils/breakReminder";

type SessionState = "NOT_STARTED" | "CLOCKED_IN" | "ON_BREAK";
type BreakEnforcementState = "OK" | "WARNING" | "BLOCKED";

const WORK_REMINDER_SECONDS = 4.5 * 60 * 60; // 16200s

export default function Index() {
  const router = useRouter();
  const now = new Date();
  const { user } = useAuth();
  const { data: shifts, isLoading, isError, error } = useShifts(user?.id);

  const [temperature, setTemperature] = useState<string>("--°C");
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [sessionState, setSessionState] = useState<SessionState>("NOT_STARTED");
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [previousElapsed, setPreviousElapsed] = useState(0);

  // 4.5hr in-app work reminder
  const [showWorkReminderBanner, setShowWorkReminderBanner] = useState(false);
  const [workReminderDismissed, setWorkReminderDismissed] = useState(false);

  // Break enforcement
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [breakElapsed, setBreakElapsed] = useState(0); // seconds on break
  const [breakEnforcement, setBreakEnforcement] = useState<BreakEnforcementState>("OK");

  const firstName = useMemo(() => {
    const full = user?.user_metadata?.full_name || user?.email || "";
    return full.trim().split(" ")[0] || "User";
  }, [user]);

  // Register push permissions on mount
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  // Weather fetch
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsWeatherLoading(true);
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=51.0447&longitude=-114.0719&current=temperature_2m&temperature_unit=celsius&timezone=auto`
        );
        if (!response.ok) throw new Error("Failed to fetch weather");
        const data = await response.json();
        const temp = data?.current?.temperature_2m;
        setTemperature(typeof temp === "number" ? `${Math.round(temp)}°C` : "--°C");
      } catch {
        setTemperature("--°C");
      } finally {
        setIsWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const todayShift = useMemo(() => {
    const liveShifts = shifts ?? [];
    const today = new Date();
    const base = liveShifts.find((shift) => {
      const d = new Date(shift.start_time);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    });
    if (!base) return null;
    return {
      ...base,
      _start: new Date(base.start_time),
      _end: new Date(base.end_time),
      _breakMinutes: base.unpaid_break_minutes ?? null, // nullable
    };
  }, [shifts]);

  const hasShiftToday = !!todayShift;

  const isShiftOver = todayShift
    ? new Date() > todayShift._end && sessionState === "NOT_STARTED"
    : false;

  const shiftLabel = useMemo(() => {
    if (!todayShift) return "Shift";
    const hour = todayShift._start.getHours();
    if (hour < 12) return "Morning Shift";
    if (hour < 17) return "Afternoon Shift";
    if (hour < 21) return "Evening Shift";
    return "Night Shift";
  }, [todayShift]);

  // ── Restore session state on mount ──────────────────────────
  useEffect(() => {
    if (!todayShift || !user) return;
    (async () => {
      const { data } = await supabase
        .from("shift_sessions")
        .select("id, clock_in_time, clock_out_time, session_type")
        .eq("shift_id", todayShift.id)
        .eq("employee_id", user.id)
        .is("clock_out_time", null)
        .order("clock_in_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return;

      if (data.session_type === "BREAK") {
        const restoredBreakStart = new Date(data.clock_in_time);
        setSessionState("ON_BREAK");
        setBreakStartTime(restoredBreakStart);

        // Reschedule break enforcement if manager set a limit
        if (todayShift._breakMinutes) {
          scheduleBreakEnforcement(restoredBreakStart, todayShift._breakMinutes);
        }
      } else {
        const restoredClockIn = new Date(data.clock_in_time);
        setSessionState("CLOCKED_IN");
        setClockInTime(restoredClockIn);
        scheduleBreakReminder(restoredClockIn);
      }
    })();
  }, [todayShift, user]);

  // ── Work elapsed timer ───────────────────────────────────────
  useEffect(() => {
    if (sessionState !== "CLOCKED_IN" || !clockInTime) {
      setElapsed(previousElapsed);
      return;
    }
    const tick = setInterval(() => {
      setElapsed(previousElapsed + Math.floor((Date.now() - clockInTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [sessionState, clockInTime, previousElapsed]);

  // ── 4.5hr in-app work reminder banner ───────────────────────
  useEffect(() => {
    if (sessionState === "CLOCKED_IN" && elapsed >= WORK_REMINDER_SECONDS && !workReminderDismissed) {
      setShowWorkReminderBanner(true);
    } else {
      setShowWorkReminderBanner(false);
    }
  }, [elapsed, sessionState, workReminderDismissed]);

  // ── Break elapsed timer ──────────────────────────────────────
  useEffect(() => {
    if (sessionState !== "ON_BREAK" || !breakStartTime) {
      setBreakElapsed(0);
      setBreakEnforcement("OK");
      return;
    }
    const tick = setInterval(() => {
      const secs = Math.floor((Date.now() - breakStartTime.getTime()) / 1000);
      setBreakElapsed(secs);

      // Only enforce if manager set a break limit
      if (todayShift?._breakMinutes) {
        const limitSecs = todayShift._breakMinutes * 60;
        if (secs >= limitSecs) setBreakEnforcement("BLOCKED");
        else if (secs >= limitSecs * 0.8) setBreakEnforcement("WARNING");
        else setBreakEnforcement("OK");
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [sessionState, breakStartTime, todayShift]);

  // ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator size="large" color="#063386" />
        <Text className="mt-4 text-gray-500 font-medium">Loading home screen...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-4">
        <Text className="text-center text-red-500 font-bold text-lg">Error loading home screen</Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          {String(error?.message ?? error)}
        </Text>
      </View>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const topDate = now.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatBreakElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleRefreshWeather = (_event: GestureResponderEvent) => {
    setIsWeatherLoading(true);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=51.0447&longitude=-114.0719&current=temperature_2m&temperature_unit=celsius&timezone=auto`
    )
      .then((r) => r.json())
      .then((data) => {
        const temp = data?.current?.temperature_2m;
        setTemperature(typeof temp === "number" ? `${Math.round(temp)}°C` : "--°C");
      })
      .catch(() => setTemperature("--°C"))
      .finally(() => setIsWeatherLoading(false));
  };

  const handleClockInDone = () => {
    const now = new Date();
    setSessionState("CLOCKED_IN");
    setClockInTime(now);
    setBreakStartTime(null);
    setBreakElapsed(0);
    setBreakEnforcement("OK");
    setWorkReminderDismissed(false);
    setShowWorkReminderBanner(false);
    cancelBreakEnforcement();
    scheduleBreakReminder(now);
  };

  const handleClockOutDone = (isBreak: boolean) => {
    cancelBreakReminder();
    if (isBreak) {
      const breakStart = new Date();
      setPreviousElapsed(elapsed);
      setSessionState("ON_BREAK");
      setClockInTime(null);
      setBreakStartTime(breakStart);
      setBreakElapsed(0);
      setBreakEnforcement("OK");

      // Schedule break enforcement if manager set a limit
      if (todayShift?._breakMinutes) {
        scheduleBreakEnforcement(breakStart, todayShift._breakMinutes);
      }
    } else {
      cancelBreakEnforcement();
      setPreviousElapsed(0);
      setElapsed(0);
      setSessionState("NOT_STARTED");
      setClockInTime(null);
      setBreakStartTime(null);
      setBreakElapsed(0);
      setBreakEnforcement("OK");
      setWorkReminderDismissed(false);
      setShowWorkReminderBanner(false);
    }
  };

  // ── Break section UI ─────────────────────────────────────────
  const renderBreakSection = () => {
    const limitSecs = todayShift?._breakMinutes ? todayShift._breakMinutes * 60 : null;
    const remainingSecs = limitSecs ? Math.max(0, limitSecs - breakElapsed) : null;

    // BLOCKED — clock-in button replaced with locked state
    if (breakEnforcement === "BLOCKED") {
      return (
        <View className="gap-3 mb-4">
          <View
            className="rounded-2xl p-4 items-center gap-2"
            style={{ backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" }}
          >
            <Ionicons name="lock-closed" size={28} color="#EF4444" />
            <Text className="font-bold text-red-700 text-base">Break Time Is Up</Text>
            <Text className="text-red-500 text-xs text-center leading-4">
              Your {todayShift!._breakMinutes}-minute break has ended. You must clock back in now.
            </Text>
            {/* Overrun time */}
            <View
              className="flex-row items-center gap-1.5 px-3 py-1 rounded-full mt-1"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <Ionicons name="time-outline" size={13} color="#EF4444" />
              <Text className="text-xs font-bold text-red-600">
                Over by {formatBreakElapsed(breakElapsed - limitSecs!)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // WARNING — amber banner above the normal on-break UI
    if (breakEnforcement === "WARNING") {
      return (
        <View
          className="flex-row items-start gap-3 p-4 rounded-2xl mb-4"
          style={{ backgroundColor: "#FFFBEB", borderWidth: 1.5, borderColor: "#FDE68A" }}
        >
          <Ionicons name="warning-outline" size={20} color="#92400E" style={{ marginTop: 1 }} />
          <View className="flex-1">
            <Text className="font-bold text-amber-800 text-sm">Break Ending Soon</Text>
            <Text className="text-amber-700 text-xs mt-0.5 leading-4">
              {remainingSecs !== null
                ? `${Math.ceil(remainingSecs / 60)} minute${Math.ceil(remainingSecs / 60) !== 1 ? "s" : ""} left on your break.`
                : "Your break is almost over."}{" "}
              Head back soon!
            </Text>
          </View>
        </View>
      );
    }

    // OK — standard on-break banner with timer
    return (
      <View className="bg-amber-50 border border-amber-100 rounded-2xl p-4 items-center mb-5 gap-1">
        <Text className="text-2xl">☕</Text>
        <Text className="font-bold text-amber-800 text-base">On Break</Text>
        {limitSecs !== null && (
          <View className="flex-row items-center gap-1.5 mt-1">
            <Text className="text-amber-600 text-sm tabular-nums">
              {formatBreakElapsed(breakElapsed)}
            </Text>
            <Text className="text-amber-400 text-sm">/</Text>
            <Text className="text-amber-600 text-sm font-semibold">
              {todayShift!._breakMinutes}:00
            </Text>
          </View>
        )}
        <Text className="text-amber-500 text-xs mt-0.5">
          Clock back in when you're ready
        </Text>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* ── Hero header ───────────────────────────────── */}
      <View className="bg-brand-secondary pb-[90px] overflow-hidden">
        <View style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: "#1a3278", opacity: 0.55 }} />
        <View style={{ position: "absolute", bottom: 30, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "#162550", opacity: 0.7 }} />

        <View className="px-6 pt-7">
          <View className="flex-row items-center space-x-5 mb-[18px] p-2">
            <View className="w-24 h-24 rounded-full bg-brand-primary/10 border-[1.5px] border-brand-primary/45 items-center justify-center mr-2">
              <Ionicons name="person" size={36} color="#62CCEF" />
            </View>
            <View className="flex-1">
              <Text className="text-[22px] font-semibold text-white/45 tracking-[1.3px] uppercase mb-2 ml-3">
                {getGreeting()}
              </Text>
              <View className="flex-row items-center ml-3">
                <Text className="text-[21px] font-bold text-white tracking-[0.2px]">
                  {firstName}
                </Text>
                <MaterialCommunityIcons name="hand-wave" size={22} color="#eab308" style={{ marginLeft: 6 }} />
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-5 ml-2">
            <View className="flex-row items-center bg-white/10 border border-white/10 rounded-[20px] px-3 py-2 gap-1.5">
              <Ionicons name="calendar-outline" size={12} color="red" />
              <Text className="text-white text-[11px] font-medium">{topDate}</Text>
            </View>

            <Pressable
              onPress={handleRefreshWeather}
              className="flex-row items-center bg-white/10 border border-white/10 rounded-[20px] px-3 py-2 gap-1.5"
            >
              <Ionicons name="cloud" size={12} color="white" />
              <Text className="text-white text-[11px] font-medium">
                {isWeatherLoading ? "Loading..." : temperature}
              </Text>
            </Pressable>

            <View className={`flex-row items-center gap-1.5 rounded-[20px] px-3 py-1.5 border ${hasShiftToday ? "bg-brand-success/15 border-brand-success/30" : "bg-white/10 border-white/10"}`}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: hasShiftToday ? "#4ade80" : "#ffffff" }} />
              <Text className={`text-[11px] font-semibold ${hasShiftToday ? "text-brand-success" : "text-white"}`}>
                {hasShiftToday ? "Shift today" : "No shifts"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Main card ─────────────────────────────────── */}
      <View className="-mt-14 px-6 pb-6">
        <View
          className="bg-white rounded-3xl overflow-hidden"
          style={{
            shadowColor: "#0d1b3e",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 6,
          }}
        >
          {/* Card header */}
          <View className="flex-row items-center justify-between px-5 pt-5 p-7 border-b border-gray-300">
            <View className="flex-row items-center gap-2">
              <View className={`w-2 h-2 pt-2 rounded-full ${hasShiftToday ? "bg-green-400" : "bg-gray-300"}`} />
              <Text className="text-[12px] font-bold text-gray-600 tracking-widest uppercase">
                Today's Shift
              </Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/mySchedule" as any)}>
              <Text className="text-brand-secondaryLight font-bold text-md">View Schedule</Text>
            </Pressable>
          </View>

          {hasShiftToday && todayShift ? (
            <>
              {/* ── Shift time row ── */}
              <View className="px-5 py-4 flex-row items-center justify-between border-b pb-6 border-gray-300">
                <View>
                  <Text className="text-[20px] font-bold text-gray-800">{shiftLabel}</Text>
                  <Text className="text-md text-gray-600 mt-2 font-medium">
                    {formatTime(todayShift._start)} — {formatTime(todayShift._end)}
                  </Text>
                </View>
                <View className="bg-blue-50 px-3 py-1.5 rounded-full">
                  <Text className="text-blue-600 text-md font-bold">
                    {Math.round((todayShift._end.getTime() - todayShift._start.getTime()) / 3600000)}h shift
                  </Text>
                </View>
              </View>

              {/* ── Clock section ── */}
              <View className="px-5 py-5">

                {/* Live work timer */}
                {sessionState === "CLOCKED_IN" && (
                  <View className="items-center mb-5 py-2">
                    <Text className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-2">
                      Total Time Worked
                    </Text>
                    <Text
                      className="text-[52px] font-extrabold text-gray-900 tabular-nums"
                      style={{ letterSpacing: -2 }}
                    >
                      {formatElapsed(elapsed)}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-2 bg-green-50 px-3 py-1.5 rounded-full">
                      <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <Text className="text-green-600 font-semibold text-xs">
                        Currently clocked in
                      </Text>
                    </View>
                  </View>
                )}

                {/* 4.5hr work reminder banner */}
                {showWorkReminderBanner && (
                  <View
                    className="flex-row items-start gap-3 p-4 rounded-2xl mb-4"
                    style={{ backgroundColor: "#FFFBEB", borderWidth: 1.5, borderColor: "#FDE68A" }}
                  >
                    <Text className="text-xl mt-0.5">☕</Text>
                    <View className="flex-1">
                      <Text className="font-bold text-amber-800 text-sm">Time for a break</Text>
                      <Text className="text-amber-700 text-xs mt-0.5 leading-4">
                        You've been working for over 4.5 hours. Coordinate with your manager to take a break.
                      </Text>
                    </View>
                    <Pressable onPress={() => setWorkReminderDismissed(true)} hitSlop={10}>
                      <Ionicons name="close-outline" size={18} color="#92400E" />
                    </Pressable>
                  </View>
                )}

                {/* On break section */}
                {sessionState === "ON_BREAK" && renderBreakSection()}

                {/* Clock In */}
                {(sessionState === "NOT_STARTED" || sessionState === "ON_BREAK") && (
                  isShiftOver ? (
                    <View
                      className="rounded-2xl p-5 items-center gap-3"
                      style={{ backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB" }}
                    >
                      <View
                        className="w-16 h-16 rounded-full items-center justify-center"
                        style={{ backgroundColor: "#F3F4F6" }}
                      >
                        <Ionicons name="time-outline" size={30} color="#9CA3AF" />
                      </View>
                      <Text className="text-gray-800 font-bold text-lg">Shift Has Ended</Text>
                      <Text className="text-gray-400 text-md text-center leading-5">
                        This shift is no longer available to clock in to.
                      </Text>
                    </View>
                  ) : (
                    <ClockInButton
                      userId={user?.id || ""}
                      shiftId={todayShift.id || "demo-shift"}
                      shiftEndTime={todayShift._end}
                      onDone={handleClockInDone}
                    />
                  )
                )}

                {/* Clock Out */}
                {sessionState === "CLOCKED_IN" && (
                  <ClockOutButton
                    userId={user?.id || ""}
                    shiftId={todayShift.id || "demo-shift"}
                    shiftEndTime={todayShift._end}
                    onDone={handleClockOutDone}
                  />
                )}
              </View>
            </>
          ) : (
            <View className="items-center py-10 px-6 gap-3">
              <View className="w-20 h-20 rounded-full bg-yellow-50 items-center justify-center mb-2">
                <Ionicons name="moon-outline" size={32} color="#eab308" />
              </View>
              <Text className="text-[20px] font-extrabold text-gray-800">No shift today</Text>
              <Text className="text-[16px] text-gray-400 text-center leading-5">
                You're off the clock.. enjoy your time off!
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
