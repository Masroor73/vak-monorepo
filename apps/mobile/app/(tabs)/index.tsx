import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Alert,
  Pressable,
  ScrollView,
  ActivityIndicator,
  GestureResponderEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { ShiftStatusCard } from "@vak/ui";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ClockInButton from "../../src/components/ClockInButton";
import { useAuth } from "../../context/AuthContext";
import { useShifts } from "../../hooks/useShifts";

export default function Index() {
  const router = useRouter();
  const now = new Date();
  const { user } = useAuth();
  const { data: shifts, isLoading, isError, error } = useShifts(user?.id);

  const [temperature, setTemperature] = useState<string>("--°C");
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [isClockedIn, setIsClockedIn] = useState(false);

  const firstName = useMemo(() => {
    const full = user?.user_metadata?.full_name || user?.email || "";
    return full.trim().split(" ")[0] || "User";
  }, [user]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsWeatherLoading(true);

        const latitude = 51.0447;
        const longitude = -114.0719;

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&temperature_unit=celsius&timezone=auto`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather");
        }

        const data = await response.json();
        const temp = data?.current?.temperature_2m;

        if (typeof temp === "number") {
          setTemperature(`${Math.round(temp)}°C`);
        } else {
          setTemperature("--°C");
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
        setTemperature("--°C");
      } finally {
        setIsWeatherLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const topDate = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const todayShift = useMemo(() => {
    const liveShifts = shifts ?? [];
    const today = new Date();

    const base = liveShifts.find((shift) => {
      const shiftDate = new Date(shift.start_time);
      return (
        shiftDate.getFullYear() === today.getFullYear() &&
        shiftDate.getMonth() === today.getMonth() &&
        shiftDate.getDate() === today.getDate()
      );
    });

    if (!base) return null;

    return {
      ...base,
      _start: new Date(base.start_time),
      _end: new Date(base.end_time),
    };
  }, [shifts]);

  const hasShiftToday = !!todayShift;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const handleClockInDone = () => {
    setIsClockedIn(true);
    Alert.alert("Clock in successful");
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    Alert.alert("Clock out successful");
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator size="large" color="#063386" />
        <Text className="mt-4 text-gray-500 font-medium">
          Loading home screen...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-4">
        <Text className="text-center text-red-500 font-bold text-lg">
          Error loading home screen
        </Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          {String(error?.message ?? error)}
        </Text>
      </View>
    );
  }

  const handleRefreshWeather = (event: GestureResponderEvent) => {
    setIsWeatherLoading(true);
    const fetchWeatherData = async () => {
      try {
        const latitude = 51.0447;
        const longitude = -114.0719;

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&temperature_unit=celsius&timezone=auto`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather");
        }

        const data = await response.json();
        const temp = data?.current?.temperature_2m;

        if (typeof temp === "number") {
          setTemperature(`${Math.round(temp)}°C`);
        } else {
          setTemperature("--°C");
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
        setTemperature("--°C");
      } finally {
        setIsWeatherLoading(false);
      }
    };

    fetchWeatherData();
  };

  return (
    <ScrollView className="flex-1 bg-brand-background">
      <View className="bg-brand-secondary pb-[100px] overflow-hidden">
        <View
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "#1a3278",
            opacity: 0.55,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 30,
            left: -30,
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: "#162550",
            opacity: 0.7,
          }}
        />

        <View className="px-6 pt-7">
          <View className="flex-row items-center space-x-5 mb-[18px] p-2">
            <View className="w-24 h-24 rounded-full bg-brand-primary/10 border-[1.5px] border-brand-primary border-white/22 items-center justify-center mr-2">
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
                <MaterialCommunityIcons
                  name="hand-wave"
                  size={22}
                  color="#eab308"
                  style={{ marginLeft: 6 }}
                />
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-5 ml-2">

            {/* DATE */}
            <View className="flex-row items-center bg-white/10 border border-white/10 rounded-[20px] px-3 py-2 gap-1.5">
              <Ionicons name="calendar-outline" size={12} color="red" />
              <Text className="text-white/65 text-[11px] font-medium">
                {topDate}
              </Text>
            </View>

            {/* WEATHER */}
            <Pressable
              onPress={handleRefreshWeather}
              className="flex-row items-center bg-white/10 border border-white/10 rounded-[20px] px-3 py-2 gap-1.5"
            >
              <Ionicons name="cloud" size={12} color="white" />
              <Text className="text-white/65 text-[11px] font-medium">
                {isWeatherLoading ? "Loading..." : temperature}
              </Text>
            </Pressable>

            {/* SHIFT STATUS */}
            <View
              className={`flex-row items-center gap-1.5 rounded-[20px] px-3 py-1.5 border ${
                hasShiftToday
                  ? "bg-brand-success/15 border-brand-success/30"
                  : "bg-white/10 border-white/10"
              }`}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: hasShiftToday
                    ? "#4ade80"
                    : "rgba(255,255,255,0.35)",
                }}
              />
              <Text
                className={`text-[11px] font-semibold ${
                  hasShiftToday ? "text-brand-success" : "text-white/65"
                }`}
              >
                {hasShiftToday ? "Shift today" : "No shifts"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="-mt-16 px-4">
        <View
          className="bg-white rounded px-5 pt-5 pb-5 mb-3"
          style={{
            shadowColor: "#0d1b3e",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.1,
            shadowRadius: 18,
            elevation: 6,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className={`w-3 h-3 rounded-full ${hasShiftToday ? "bg-brand-success" : "bg-gray-300"}`} />
              <Text className="text-md font-bold text-gray-500 tracking-widest uppercase">
                Today's Shift
              </Text>
            </View>

            <Pressable onPress={() => router.push("/(tabs)/mySchedule" as any)}>
              <Text className="text-blue-600 font-semibold text-lg">
                View Schedule
              </Text>
            </Pressable>
          </View>

          {hasShiftToday && todayShift ? (
            <>
              <ShiftStatusCard
                title="Morning Shift"
                subtitle={`${formatTime(todayShift._start)} — ${formatTime(
                  todayShift._end
                )}`}
              />

              <View
                style={{
                  marginTop: 25,
                  padding: 15,
                  borderRadius: 12,
                  backgroundColor: "#F8FAFC",
                }}
              >
                {!isClockedIn ? (
                  <ClockInButton
                    userId={user?.id || ""}
                    shiftId={todayShift.id || "demo-shift"}
                    onDone={handleClockInDone}
                  />
                ) : (
                  <View>
                    <View className="flex-row items-center mb-4">
                      <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
                      <Text className="text-green-600 font-semibold text-base">
                        You are currently clocked in
                      </Text>
                    </View>

                    <Pressable
                      onPress={handleClockOut}
                      className="bg-red-500 rounded-xl py-4 items-center justify-center"
                    >
                      <Text className="text-white font-bold text-base">
                        Clock Out
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View className="items-center py-6 gap-3">
              <View className="w-24 h-24 rounded-full bg-yellow-50 items-center justify-center mb-1">
                <Ionicons name="moon-outline" size={35} color="#eab308" />
              </View>

              <Text className="text-[20px] font-extrabold text-gray-800">
                No shift today
              </Text>

              <Text className="text-[16px] font-semibold text-gray-600 text-center px-6">
                You're off the clock! enjoy your time off!
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}