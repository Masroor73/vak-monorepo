import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Modal, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBadge } from "@vak/ui";
import { Shift } from "@vak/contract";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ClockInButton from "../../../src/components/ClockInButton";
import ClockOutButton from "../../../src/components/ClockOutButton";
import { supabase } from "../../../lib/supabase";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationRow = {
  id: string;
  name: string;
  lat: number;
  long: number;
  geofence_radius_meters: number;
};

type Coords = {
  latitude: number;
  longitude: number;
};

// ─── Fallback ─────────────────────────────────────────────────────────────────
const FALLBACK_LOCATION: LocationRow = {
  id: "damascus-hq",
  name: "Damascus Headquarters",
  lat: 51.0447,
  long: -114.0719,
  geofence_radius_meters: 150,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function buildRouteLine(from: Coords, to: Coords): Coords[] {
  const steps = 8;
  return Array.from({ length: steps + 1 }, (_, i) => ({
    latitude: from.latitude + ((to.latitude - from.latitude) * i) / steps,
    longitude: from.longitude + ((to.longitude - from.longitude) * i) / steps,
  }));
}

function buildRegion(a: Coords, b: Coords) {
  const minLat = Math.min(a.latitude, b.latitude);
  const maxLat = Math.max(a.latitude, b.latitude);
  const minLng = Math.min(a.longitude, b.longitude);
  const maxLng = Math.max(a.longitude, b.longitude);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.01),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.01),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShiftDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [showClockIn, setShowClockIn] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [shift, setShift] = useState<Shift | null>(null);
  const [workLocation, setWorkLocation] = useState<LocationRow | null>(null);
  const [employeeCoords, setEmployeeCoords] = useState<Coords | null>(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // ── Active session state ──────────────────────────────────────────────────
  const [activeSession, setActiveSession] = useState<"WORK" | "BREAK" | null>(null);
  const [activeOnOtherShift, setActiveOnOtherShift] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showAlreadyClockedInModal, setShowAlreadyClockedInModal] = useState(false);
  const [tooEarlyModal, setTooEarlyModal] = useState(false); // ← added

  const mapRef = useRef<MapView>(null);

  // ── 1. Load shift ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadShift = async () => {
      if (!id) { setLoadingShift(false); return; }
      try {
        setLoadingShift(true);
        const { data, error } = await supabase
          .from("shifts")
          .select("*")
          .eq("id", String(id))
          .single();

        if (error || !data) {
          setShift(null);
          return;
        }

        setShift(data as any as Shift);
      } catch (err) {
        console.error("[ShiftDetails] unexpected error:", err);
        setShift(null);
      } finally {
        setLoadingShift(false);
      }
    };
    loadShift();
  }, [id]);

  // ── 2. Load work location ─────────────────────────────────────────────────
  useEffect(() => {
    if (!shift) return;

    const raw = shift as any;
    const locationKey = raw.location_ref ?? raw.location_id ?? "damascus-hq";

    const loadLocation = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, lat, long, geofence_radius_meters")
        .eq("id", locationKey)
        .single();

      if (error || !data) {
        setWorkLocation(FALLBACK_LOCATION);
        return;
      }

      setWorkLocation(data as LocationRow);
    };

    loadLocation();
  }, [shift]);

  // ── 3. Global open-session check ──────────────────────────────────────────
  useEffect(() => {
    if (!shift || !user) return;

    const checkSession = async () => {
      setCheckingSession(true);

      const { data } = await supabase
        .from("shift_sessions")
        .select("shift_id, session_type")
        .eq("employee_id", user.id)
        .is("clock_out_time", null)
        .order("clock_in_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        setActiveSession(null);
        setActiveOnOtherShift(false);
      } else if (data.shift_id === shift.id) {
        setActiveSession(data.session_type as "WORK" | "BREAK");
        setActiveOnOtherShift(false);
      } else {
        setActiveSession(null);
        setActiveOnOtherShift(true);
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [shift, user]);

  // ── 4. Get employee GPS (non-blocking) ────────────────────────────────────
  useEffect(() => {
    const getGps = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsError("Location permission denied");
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setEmployeeCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (e) {
        setGpsError("Could not get your location");
      }
    };
    getGps();
  }, []);

  // ── 5. Re-fit map when employee pin arrives ───────────────────────────────
  useEffect(() => {
    if (!employeeCoords || !workLocation || !mapRef.current) return;
    const workCoords: Coords = {
      latitude: Number(workLocation.lat),
      longitude: Number(workLocation.long),
    };
    setTimeout(() => {
      mapRef.current?.animateToRegion(buildRegion(employeeCoords, workCoords), 600);
    }, 300);
  }, [employeeCoords, workLocation]);

  // ── 6. Auto-navigate back after successful clock-in ───────────────────────
  useEffect(() => {
    if (!clockedIn) return;
    const t = setTimeout(() => router.back(), 2000);
    return () => clearTimeout(t);
  }, [clockedIn]);

  // ─── Loading / not-found ──────────────────────────────────────────────────

  if (loadingShift) {
    return (
      <View className="flex-1 bg-brand-background items-center justify-center px-6">
        <ActivityIndicator size="large" color="#063386" />
        <Text className="mt-4 text-gray-500 font-medium">Loading shift...</Text>
      </View>
    );
  }

  if (!shift) {
    return (
      <View className="flex-1 bg-brand-background items-center justify-center px-6">
        <Text className="text-lg font-bold text-gray-800">Shift not found</Text>
        <Pressable onPress={() => router.back()} className="mt-6 bg-brand-secondary rounded-2xl px-6 py-3">
          <Text className="text-white font-bold text-sm">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Derived values ───────────────────────────────────────────────────────

  const startTime = formatTime(shift.start_time);
  const endTime = formatTime(shift.end_time);
  const dateLabel = formatDate(shift.start_time);
  const duration = getDurationHours(shift.start_time, shift.end_time);

  const isShiftOver = new Date() >= new Date(shift.end_time);
  const isShiftStarted = new Date() >= new Date(shift.start_time); // ← added
  const canClockIn = shift.status === "PUBLISHED" && !isShiftOver && !activeSession && !activeOnOtherShift;
  const canClockOut = activeSession === "WORK" && !isShiftOver;

  const workCoords: Coords | null = workLocation
    ? { latitude: Number(workLocation.lat), longitude: Number(workLocation.long) }
    : null;

  const mapRegion = workCoords
    ? employeeCoords
      ? buildRegion(employeeCoords, workCoords)
      : { latitude: workCoords.latitude, longitude: workCoords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : null;

  const routeLine = employeeCoords && workCoords
    ? buildRouteLine(employeeCoords, workCoords)
    : [];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-brand-background">

      {/* ── Already Clocked In Modal ── */}
      <Modal
        visible={showAlreadyClockedInModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlreadyClockedInModal(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center px-8"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onPress={() => setShowAlreadyClockedInModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-3xl px-6 pt-8 pb-6 items-center gap-4">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-1"
                style={{ backgroundColor: "#FEF3C7" }}
              >
                <Ionicons name="warning-outline" size={40} color="#D97706" />
              </View>
              <Text className="text-gray-900 font-bold text-xl text-center">
                Already Clocked In
              </Text>
              <Text className="text-gray-500 text-sm text-center leading-6">
                You're currently clocked into another shift. Please clock out of that shift before clocking in to this one.
              </Text>
              <TouchableOpacity
                onPress={() => setShowAlreadyClockedInModal(false)}
                className="mt-2 py-3.5 rounded-xl w-full items-center"
                style={{ backgroundColor: "#0d1b3e" }}
              >
                <Text className="text-white font-bold text-base">Got it</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Too Early Modal ── */}
      <Modal
        visible={tooEarlyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setTooEarlyModal(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center px-5"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onPress={() => setTooEarlyModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-3xl px-6 pt-8 pb-6 items-center gap-4">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-1"
                style={{ backgroundColor: "#DBEAFE" }}
              >
                <Ionicons name="hourglass-outline" size={40} color="#3B82F6" />
              </View>
              <Text className="text-gray-900 font-bold text-xl text-center">
                Too Early to Clock In
              </Text>
              <Text className="text-gray-500 text-sm text-center leading-6">
                You can only clock in once your shift has started.
              </Text>
              <TouchableOpacity
                onPress={() => setTooEarlyModal(false)}
                className="mt-2 py-3.5 rounded-2xl w-full items-center"
                style={{ backgroundColor: "#0d1b3e", }}
              >
                <Text className="text-white font-bold text-base">Got it</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View className="bg-brand-secondary pt-10 pb-16 px-10" />

      <View className="-mt-16 flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white rounded-3xl overflow-hidden shadow-xl">

            {/* ── Map ── */}
            <View className="w-full h-56 bg-blue-50 border-b border-gray-100 overflow-hidden">
              {mapRegion ? (
                <View className="flex-1">
                  <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={mapRegion}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                  >
                    {employeeCoords && (
                      <Marker coordinate={employeeCoords} title="You" anchor={{ x: 0.5, y: 0.5 }}>
                        <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center border-2 border-white">
                          <Ionicons name="person" size={14} color="#fff" />
                        </View>
                      </Marker>
                    )}

                    {workCoords && (
                      <Marker coordinate={workCoords} title={workLocation?.name ?? "Work"}>
                        <View className="w-8 h-8 rounded-full bg-brand-secondary items-center justify-center border-2 border-white">
                          <Ionicons name="business" size={14} color="#fff" />
                        </View>
                      </Marker>
                    )}

                    {routeLine.length > 0 && (
                      <Polyline
                        coordinates={routeLine}
                        strokeColor="#063386"
                        strokeWidth={3}
                        lineDashPattern={[8, 4]}
                      />
                    )}
                  </MapView>

                  {workLocation && (
                    <View className="absolute bottom-2.5 self-center flex-row items-center gap-1 bg-white/90 px-3 py-1.5 rounded-full">
                      <Ionicons name="location" size={12} color="#063386" />
                      <Text className="text-xs font-semibold text-brand-secondary">
                        {workLocation.name}
                      </Text>
                    </View>
                  )}

                  {gpsError && (
                    <View className="absolute top-2.5 right-2.5 flex-row items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                      <Ionicons name="warning-outline" size={11} color="#92400e" />
                      <Text className="text-[10px] font-semibold text-amber-800">Your location unavailable</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="flex-1 items-center justify-center gap-2">
                  <ActivityIndicator size="small" color="#063386" />
                  <Text className="text-[13px] text-gray-500 font-medium">Loading map…</Text>
                </View>
              )}
            </View>

            {/* ── Shift details ── */}
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
                  <Text className="text-[13px] text-gray-600 font-semibold uppercase">Date</Text>
                  <Text className="text-md font-bold text-gray-800">{dateLabel}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3 mb-4 bg-gray-50 rounded-lg px-4 py-3 border border-gray-400">
                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                <View className="flex-1">
                  <Text className="text-[13px] text-gray-600 font-semibold uppercase">Time</Text>
                  <Text className="text-md font-bold text-gray-800">{startTime} — {endTime}</Text>
                </View>
                <Text className="text-lg text-gray-800 font-semibold">{duration}h</Text>
              </View>

              <View className="flex-row items-center gap-3 mb-4 bg-gray-50 rounded-lg px-4 py-3 border border-gray-400">
                <Ionicons name="location-outline" size={20} color="#3b82f6" />
                <View>
                  <Text className="text-[13px] text-gray-600 font-semibold uppercase">Location</Text>
                  <Text className="text-md font-bold text-gray-800">
                    {workLocation?.name ?? (shift as any).location_id ?? "—"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3 mb-4 bg-gray-50 rounded-lg px-4 py-3 border border-gray-400">
                <MaterialCommunityIcons name="coffee-outline" size={20} color="#3b82f6" />
                <View>
                  <Text className="text-[13px] text-gray-600 font-semibold uppercase">Unpaid Break</Text>
                  <Text className="text-md font-bold text-gray-800">
                    {shift.unpaid_break_minutes ?? 45} min
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Footer ── */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-brand-background border-t border-gray-100">

          {checkingSession ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#063386" />
            </View>

          ) : clockedIn ? (
            <View className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-5 items-center gap-2">
              <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mb-1">
                <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
              </View>
              <Text className="text-emerald-800 font-bold text-base">You're clocked in!</Text>
              <Text className="text-emerald-600 text-sm text-center">Going back to your schedule…</Text>
            </View>

          ) : canClockOut ? (
            <ClockOutButton
              shiftId={String(shift.id)}
              userId={user?.id || ""}
              shiftEndTime={new Date(shift.end_time)}
              onDone={(isBreak) => {
                if (isBreak) {
                  setActiveSession(null);
                } else {
                  router.back();
                }
              }}
            />

          ) : activeOnOtherShift && !isShiftOver ? (
            <TouchableOpacity
              onPress={() => setShowAlreadyClockedInModal(true)}
              className="rounded-2xl py-5 items-center justify-center flex-row gap-2"
              style={{ backgroundColor: "#FEF3C7", borderWidth: 1.5, borderColor: "#FDE68A" }}
            >
              <Ionicons name="warning-outline" size={18} color="#D97706" />
              <Text className="text-amber-700 font-bold text-sm tracking-widest uppercase">
                Already Clocked In
              </Text>
            </TouchableOpacity>

          ) : showClockIn ? (
            <ClockInButton
              shiftId={String(shift.id)}
              userId={user?.id || ""}
              shiftStartTime={new Date(shift.start_time)}
              shiftEndTime={new Date(shift.end_time)}
              onDone={() => {
                setActiveSession("WORK");
                setShowClockIn(false);
              }}
            />

          ) : canClockIn ? (
            <Pressable
              onPress={() => {
                if (!isShiftStarted) {
                  setTooEarlyModal(true);
                  return;
                }
                setShowClockIn(true);
              }}
              className="bg-brand-secondary rounded-2xl py-5 items-center justify-center flex-row gap-2"
            >
              <Ionicons name="time-outline" size={18} color="#fff" />
              <Text className="text-white font-bold text-sm tracking-widest uppercase">Clock In</Text>
            </Pressable>

          ) : (
            <View className="bg-gray-100 rounded-2xl py-5 items-center justify-center flex-row gap-2">
              <Ionicons name="lock-closed" size={18} color="#9ca3af" />
              <Text className="text-gray-400 font-bold text-sm tracking-widest uppercase">
                {shift.status === "COMPLETED"
                  ? "Shift Completed"
                  : shift.status === "VOID"
                  ? "Shift Cancelled"
                  : isShiftOver
                  ? "Shift Has Ended"
                  : "Not Yet Published"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}