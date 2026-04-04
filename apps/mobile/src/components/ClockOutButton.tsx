import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { File } from "expo-file-system/next";
import { supabase } from "../../lib/supabase";

type Props = {
  shiftId: string;
  userId: string;
  shiftEndTime: Date;
  onDone: (isBreak: boolean) => void;
};

type Step = "IDLE" | "CHECKING" | "TOO_FAR" | "TYPE_MODAL" | "CAMERA" | "PREVIEW" | "UPLOADING";

export default function ClockOutButton({ shiftId, userId, shiftEndTime, onDone }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>("IDLE");
  const [distance, setDistance] = useState<number | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"BREAK" | "END" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cameraRef = useRef<any>(null);
  const locationWatcher = useRef<any>(null);

  const WORKPLACE_LAT = 51.0447;
  const WORKPLACE_LNG = -114.0719;
  const ALLOWED_RADIUS = 50000000000;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const stopLocationWatch = () => {
    if (locationWatcher.current) {
      locationWatcher.current.remove();
      locationWatcher.current = null;
    }
  };

  const startLocationWatch = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("Location access is required to clock out. Please enable it in your settings.");
      setStep("IDLE");
      return;
    }
    locationWatcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      (loc: any) => {
        const coords = loc.coords;
        setLocation(coords);
        const d = Math.round(
          calculateDistance(coords.latitude, coords.longitude, WORKPLACE_LAT, WORKPLACE_LNG)
        );
        setDistance(d);
      }
    );
  };

  useEffect(() => {
    return () => stopLocationWatch();
  }, []);

  useEffect(() => {
    if (step !== "CHECKING" || distance === null) return;
    if (distance <= ALLOWED_RADIUS) setStep("TYPE_MODAL");
    else setStep("TOO_FAR");
  }, [distance, step]);

  const handleClockOutPress = async () => {
    setErrorMsg(null);
    await requestPermission();
    setStep("CHECKING");
    await startLocationWatch();
  };

  const handleCheckAgain = async () => {
    setErrorMsg(null);
    stopLocationWatch();
    setDistance(null);
    setStep("CHECKING");
    await startLocationWatch();
  };

  const handleTypeSelect = (type: "BREAK" | "END") => {
    setSessionType(type);
    setStep("CAMERA");
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    setPreviewUri(photo.uri);
    setStep("PREVIEW");
  };

  const submitClockOut = async () => {
    if (!previewUri || !location || !sessionType) return;
    setStep("UPLOADING");
    setErrorMsg(null);

    try {
      const file = new File(previewUri);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const path = `${userId}/clockout-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("shift-proofs")
        .upload(path, bytes, { contentType: "image/jpeg", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("shift-proofs").getPublicUrl(path);
      const now = new Date().toISOString();

      const { data: openSession, error: sessionFetchError } = await supabase
        .from("shift_sessions")
        .select("id")
        .eq("shift_id", shiftId)
        .eq("employee_id", userId)
        .is("clock_out_time", null)
        .order("clock_in_time", { ascending: false })
        .limit(1)
        .single();

      if (sessionFetchError || !openSession) {
        setErrorMsg("No active session found. Please contact your manager.");
        setStep("PREVIEW");
        return;
      }

      const { error: sessionUpdateError } = await supabase
        .from("shift_sessions")
        .update({
          clock_out_time: now,
          clock_out_photo_url: urlData.publicUrl,
          clock_out_lat: location.latitude,
          clock_out_long: location.longitude,
          session_type: sessionType === "BREAK" ? "BREAK" : "WORK",
        })
        .eq("id", openSession.id);

      if (sessionUpdateError) throw sessionUpdateError;

      if (sessionType === "END") {
        // Only mark shift as COMPLETED if the shift end time has passed
        const isShiftOver = new Date() >= shiftEndTime;

        await supabase
          .from("shifts")
          .update({
            actual_end_time: now,
            ...(isShiftOver && { status: "COMPLETED" }),
            clock_out_photo_url: urlData.publicUrl,
            clock_out_lat: location.latitude,
            clock_out_long: location.longitude,
          })
          .eq("id", shiftId);
      }

      stopLocationWatch();
      onDone(sessionType === "BREAK");
    } catch (err) {
      console.error(err);
      setErrorMsg("Clock-out failed. Please try again.");
      setStep("PREVIEW");
    }
  };

  const reset = () => {
    stopLocationWatch();
    setStep("IDLE");
    setDistance(null);
    setPreviewUri(null);
    setSessionType(null);
    setErrorMsg(null);
  };

  // ── INLINE ERROR BANNER ────────────────────────────────────────────────────
  const ErrorBanner = () =>
    errorMsg ? (
      <View
        className="flex-row items-center gap-2 px-4 py-3 rounded-xl mb-3"
        style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" }}
      >
        <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
        <Text className="text-sm text-red-600 flex-1">{errorMsg}</Text>
        <TouchableOpacity onPress={() => setErrorMsg(null)}>
          <Ionicons name="close-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    ) : null;

  // ── IDLE ───────────────────────────────────────────────────────────────────
  if (step === "IDLE") {
    return (
      <View className="gap-2">
        <ErrorBanner />
        <TouchableOpacity
          onPress={handleClockOutPress}
          className="py-4 rounded-xl flex-row items-center justify-center gap-2"
          style={{ backgroundColor: "#EF4444" }}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text className="text-white font-bold text-base">Clock Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── CHECKING ───────────────────────────────────────────────────────────────
  if (step === "CHECKING") {
    return (
      <View className="py-8 items-center gap-4">
        <ActivityIndicator size="large" color="#3B82F6" />
        <View className="items-center gap-1">
          <Text className="text-gray-800 font-bold text-lg">Verifying Location</Text>
          <Text className="text-gray-400 text-sm">Please wait a moment...</Text>
        </View>
      </View>
    );
  }

  // ── TOO_FAR ────────────────────────────────────────────────────────────────
  if (step === "TOO_FAR") {
    return (
      <View className="gap-4">
        <View
          className="rounded p-5 items-center gap-3"
          style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" }}
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <Ionicons name="navigate-circle-outline" size={50} color="#EF4444" />
          </View>

          <Text className="text-gray-800 font-bold text-xl">Not at Workplace</Text>

          <View
            className="flex-row items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <Ionicons name="location-outline" size={20} color="red" />
            <Text className="font-bold text-md text-red-500">{distance}m away</Text>
            <View style={{ width: 1, height: 12, backgroundColor: "#7F1D1D" }} />
            <Text className="text-md text-gray-900">Need within {ALLOWED_RADIUS}m</Text>
          </View>

          <Text className="text-center text-md text-gray-700 leading-6">
            Move closer to your workplace to clock out. Make sure to allow location access if you
            haven't already.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCheckAgain}
          className="h-14 mt-1 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
          style={{ backgroundColor: "#0d1b3e" }}
        >
          <Text className="font-bold text-xl text-white">Check Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={reset}
          className="h-14 mt-1 rounded-2xl items-center justify-center"
          style={{ backgroundColor: "#E5E7EB" }}
        >
          <Text className="text-xl font-semibold text-gray-900">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── TYPE_MODAL ─────────────────────────────────────────────────────────────
  if (step === "TYPE_MODAL") {
    return (
      <Modal visible transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View className="bg-white rounded-t-3xl px-5 pt-6 pb-10">
            <View className="w-10 h-1 rounded-full bg-gray-200 self-center mb-6" />

            <View className="mb-6">
              <Text className="text-xl font-bold text-gray-900">Clock Out</Text>
              <Text className="text-md text-gray-500 mt-1">What would you like to do?</Text>
            </View>

            <TouchableOpacity
              onPress={() => handleTypeSelect("BREAK")}
              className="flex-row items-center gap-4 p-4 rounded-2xl mb-3"
              style={{ backgroundColor: "#FFFBEB", borderWidth: 1.5, borderColor: "#FDE68A" }}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#FEF3C7" }}
              >
                <Ionicons name="cafe-outline" size={24} color="#92400E" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900 text-base">Taking a Break</Text>
                <Text className="text-xs text-gray-800">
                  Please remember to clock back in once your break is finished.
                </Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTypeSelect("END")}
              className="flex-row items-center gap-4 p-4 rounded-2xl mb-5"
              style={{ backgroundColor: "#FFF1F2", borderWidth: 1.5, borderColor: "#FECDD3" }}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#FEE2E2" }}
              >
                <Ionicons name="flag-outline" size={24} color="#991B1B" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900 text-base">End Shift</Text>
                <Text className="text-md text-gray-800 mt-0.5">
                  This will complete your shift for today
                </Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#D1D5DB" />
            </TouchableOpacity>

            <View className="items-center mt-4">
              <TouchableOpacity
                onPress={reset}
                className="py-3 px-6 rounded-xl"
                style={{ backgroundColor: "#1a3278", width: "50%" }}
              >
                <Text className="text-white text-center font-semibold text-base">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── CAMERA ─────────────────────────────────────────────────────────────────
  if (step === "CAMERA") {
    return (
      <View className="gap-3">
        <View
          className="flex-row items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" }}
        >
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
          <Text className="text-sm font-semibold flex-1 text-green-700">
            Location confirmed. Take a{" "}
            {sessionType === "BREAK" ? "selfie for break" : "selfie to end shift"}
          </Text>
        </View>

        <View className="rounded-2xl overflow-hidden" style={{ height: 300 }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
            <View
              className="absolute bottom-0 left-0 right-0 pb-5 pt-8 items-center"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            >
              <TouchableOpacity
                onPress={takePicture}
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#EF4444",
                  shadowColor: "#EF4444",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <Ionicons name="camera-outline" size={28} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white/70 text-xs mt-2">Tap to capture</Text>
            </View>
          </CameraView>
        </View>

        <TouchableOpacity onPress={reset} className="items-center py-1">
          <Text className="text-gray-400 text-sm">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (step === "PREVIEW" && previewUri) {
    return (
      <View className="gap-3">
        <ErrorBanner />

        <View className="rounded-2xl overflow-hidden" style={{ height: 300 }}>
          <Image source={{ uri: previewUri }} style={{ flex: 1 }} resizeMode="cover" />
          <View
            className="absolute top-3 left-3 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <Ionicons name="image-outline" size={13} color="#fff" />
            <Text className="text-white text-xs font-semibold">
              {sessionType === "BREAK" ? "Break Photo" : "Clock-Out Photo"}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => { setPreviewUri(null); setErrorMsg(null); setStep("CAMERA"); }}
            className="flex-1 border border-gray-200 py-3.5 rounded-xl flex-row items-center justify-center gap-1.5 bg-brand-secondary"
          >
            <Text className="text-white font-semibold">Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={submitClockOut}
            className="flex-1 py-3.5 rounded-xl flex-row items-center justify-center gap-1.5"
            style={{ backgroundColor: "#EF4444" }}
          >
            <Text className="text-white font-bold">
              {sessionType === "BREAK" ? "Start Break" : "End Shift"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── UPLOADING ──────────────────────────────────────────────────────────────
  if (step === "UPLOADING") {
    return (
      <View className="py-8 items-center gap-4">
        <ActivityIndicator size="large" color="#EF4444" />
        <View className="items-center gap-1">
          <Text className="text-gray-800 font-bold text-base">
            {sessionType === "BREAK" ? "Starting Break" : "Ending Shift"}
          </Text>
          <Text className="text-gray-400 text-sm">Just a second...</Text>
        </View>
      </View>
    );
  }

  return null;
}