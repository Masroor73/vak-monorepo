import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { File } from "expo-file-system/next";
import { supabase } from "../../lib/supabase";
import * as SecureStore from "expo-secure-store";



type Props = {
  shiftId: string;
  userId: string;
  shiftStartTime: Date; 
  shiftEndTime: Date;
  onDone: () => void;
};

type Step = "IDLE" | "TOO_EARLY" | "SHIFT_OVER" | "CHECKING" | "TOO_FAR" | "CAMERA" | "PREVIEW" | "UPLOADING" | "ERROR" | "DEVICE_BLOCKED";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getOrCreateDeviceId(): Promise<string> {
  const key = "vak_device_id";
  let deviceId = await SecureStore.getItemAsync(key);
  if (!deviceId) {
    deviceId = generateUUID();
    await SecureStore.setItemAsync(key, deviceId);
  }
  return deviceId;
}

export default function ClockInButton({ shiftId, userId, shiftStartTime, shiftEndTime, onDone }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>("IDLE");
  const [distance, setDistance] = useState<number | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const cameraRef = useRef<any>(null);
  const locationWatcher = useRef<any>(null);

  const WORKPLACE_LAT = 51.0447;
  const WORKPLACE_LNG = -114.0719;
  const ALLOWED_RADIUS = 500000000000;

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
      setErrorMessage("Location access is needed to clock in. Please enable it in your settings.");
      setStep("ERROR");
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
    if (distance <= ALLOWED_RADIUS) setStep("CAMERA");
    else setStep("TOO_FAR");
  }, [distance, step]);

  // checks TOO_EARLY before SHIFT_OVER
  const handleClockInPress = async () => {
    if (new Date() < shiftStartTime) {
      setStep("TOO_EARLY");
      return;
    }
    if (new Date() > shiftEndTime) {
      setStep("SHIFT_OVER");
      return;
    }

  const id = deviceId ?? await getOrCreateDeviceId();
  const bufferTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: activeOnDevice } = await supabase
    .from("shift_sessions")
    .select("employee_id")
    .eq("device_id", id)
    .neq("employee_id", userId)
    .is("clock_out_time", null)
    .maybeSingle();

  if (activeOnDevice) { setStep("DEVICE_BLOCKED"); return; }

  const { data: recentOnDevice } = await supabase
    .from("shift_sessions")
    .select("employee_id")
    .eq("device_id", id)
    .neq("employee_id", userId)
    .gt("clock_out_time", bufferTime)
    .maybeSingle();

  if (recentOnDevice) { setStep("DEVICE_BLOCKED"); return; }

    await requestPermission();
    setStep("CHECKING");
    await startLocationWatch();
  };

  const handleCheckAgain = async () => {
    stopLocationWatch();
    setDistance(null);
    setStep("CHECKING");
    await startLocationWatch();
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    setPreviewUri(photo.uri);
    setStep("PREVIEW");
  };

  const submitClockIn = async () => {
    if (!previewUri || !location) return;
    setStep("UPLOADING");
    try {
      const file = new File(previewUri);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const path = `${userId}/clockin-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("shift-proofs")
        .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("shift-proofs").getPublicUrl(path);
      const now = new Date().toISOString();

      const { error: sessionError } = await supabase.from("shift_sessions").insert({
        shift_id: shiftId,
        employee_id: userId,
        session_type: "WORK",
        clock_in_time: now,
        clock_in_photo_url: urlData.publicUrl,
        clock_in_lat: location.latitude,
        clock_in_long: location.longitude,
        device_id: deviceId,
      });
      if (sessionError) throw sessionError;

      const { data: existingShift, error: fetchError } = await supabase
        .from("shifts")
        .select("actual_start_time")
        .eq("id", shiftId)
        .single();

      if (fetchError) throw fetchError;

      if (!existingShift?.actual_start_time) {
        const { data: updated, error: shiftUpdateError } = await supabase
          .from("shifts")
          .update({
            actual_start_time: now,
            status: "COMPLETED",
            clock_in_photo_url: urlData.publicUrl,
            clock_in_lat: location.latitude,
            clock_in_long: location.longitude,
          })
          .eq("id", shiftId)
          .select();

        if (shiftUpdateError) throw shiftUpdateError;

        if (!updated || updated.length === 0) {
          throw new Error(`Shift update matched 0 rows. shiftId: ${shiftId}`);
        }
      }

      stopLocationWatch();
      onDone();
    } catch (err) {
      console.error("submitClockIn error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong while clocking in."
      );
      setStep("ERROR");
    }
  };

  const reset = () => {
    stopLocationWatch();
    setStep("IDLE");
    setDistance(null);
    setPreviewUri(null);
    setErrorMessage(null);
  };

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (step === "IDLE") {
    // check TOO_EARLY first
    if (new Date() < shiftStartTime) {
      return (
        <View
          className="rounded-2xl p-5 items-center gap-3"
          style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "#DBEAFE" }}
          >
            <Ionicons name="hourglass-outline" size={30} color="#3B82F6" />
          </View>
          <Text className="text-gray-800 font-bold text-lg">Too Early to Clock In</Text>
          <Text className="text-gray-600 text-md text-center leading-5">
            You can only clock in once your shift has started.
          </Text>
        </View>
      );
    }

    if (new Date() > shiftEndTime) {
      return (
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
          <Text className="text-gray-400 text-sm text-center leading-5">
            This shift is no longer available to clock in to. Check your schedule for upcoming shifts.
          </Text>
        </View>
      );
    }

    return (
      <View>
        <View className="flex-row items-center justify-center gap-0 mb-8 mt-5">
          {[
            { icon: "location-outline", label: "Location" },
            { icon: "camera-outline", label: "Selfie" },
            { icon: "checkmark-circle-outline", label: "Done" },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <View className="items-center gap-1.5">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#DBEAFE" }}
                >
                  <Ionicons name={item.icon as any} size={30} color="#3B82F6" />
                </View>
                <Text className="text-[13px] font-medium text-gray-500">{item.label}</Text>
              </View>
              {i < 2 && (
                <View
                  className="mb-4"
                  style={{ width: 28, height: 1.5, backgroundColor: "#DBEAFE", marginHorizontal: 4 }}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleClockInPress}
          className="py-4 rounded flex-row items-center justify-center gap-5"
          style={{
            backgroundColor: "#0d1b3e",
            shadowColor: "#0d1b3e",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <Ionicons name="log-in-outline" size={25} color="#62CCEF" />
          <Text className="font-extrabold text-base text-white">Clock In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── TOO_EARLY ─────────────────────────────────────────────────────────────── ← new
  if (step === "TOO_EARLY") {
    return (
      <View
        className="rounded-2xl p-5 items-center gap-3"
        style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" }}
      >
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: "#DBEAFE" }}
        >
          <Ionicons name="hourglass-outline" size={30} color="#3B82F6" />
        </View>
        <Text className="text-gray-800 font-bold text-lg">Too Early to Clock In</Text>
        <Text className="text-gray-400 text-sm text-center leading-5">
          You can only clock in once your shift has started.
        </Text>
        <TouchableOpacity onPress={reset} className="mt-1">
          <Text className="text-blue-500 font-semibold text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── SHIFT OVER ───────────────────────────────────────────────────────────────
  if (step === "SHIFT_OVER") {
    return (
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
        <Text className="text-gray-400 text-sm text-center leading-5">
          This shift is no longer available to clock in to. Check your schedule for upcoming shifts.
        </Text>
      </View>
    );
  }

  // ── DEVICE BLOCKED OR NOT───────────────────────────────────────────────────────────────
  if (step === "DEVICE_BLOCKED") {
  return (
    <View
      className="rounded-2xl p-5 items-center gap-3"
      style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" }}
    >
      <View
        className="w-16 h-16 rounded-full items-center justify-center"
        style={{ backgroundColor: "#FEE2E2" }}
      >
        <Ionicons name="phone-portrait-outline" size={30} color="#EF4444" />
      </View>
      <Text className="text-gray-800 font-bold text-lg">Device Already In Use</Text>
      <Text className="text-gray-400 text-sm text-center leading-5">
        Another user is clocked in on this device. Please use a different device or wait 60 minutes after their clock-out.
      </Text>
      <TouchableOpacity onPress={reset} className="mt-1">
        <Text className="text-red-500 font-semibold text-sm">Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

  // ── CHECKING ─────────────────────────────────────────────────────────────────
  if (step === "CHECKING") {
    return (
      <View className="py-8 items-center gap-4">
        <ActivityIndicator size="large" color="#3B82F6" />
        <View className="items-center gap-1">
          <Text className="text-gray-800 font-bold text-lg">Verifying Location</Text>
          <Text className="text-gray-400 text-lg">Please wait a moment...</Text>
        </View>
      </View>
    );
  }

  // ── TOO_FAR ───────────────────────────────────────────────────────────────────
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
            Move closer to your workplace to clock in. Make sure to allow location access if you haven't already.
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

  // ── CAMERA ────────────────────────────────────────────────────────────────────
  if (step === "CAMERA") {
    return (
      <View className="gap-3">
        <View
          className="flex-row items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" }}
        >
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
          <Text className="text-sm font-semibold flex-1 text-green-700">
            Location confirmed. take your selfie
          </Text>
        </View>

        <View className="rounded-2xl overflow-hidden" style={{ height: 300 }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
            <View
              className="absolute bottom-0 left-0 right-0 pb-5 pt-10 items-center"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            >
              <TouchableOpacity
                onPress={takePicture}
                className="w-16 h-16 rounded-full items-center justify-center bg-white"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Ionicons name="camera-outline" size={28} color="#0d1b3e" />
              </TouchableOpacity>
              <Text className="text-xs mt-2 text-white/70">Tap to capture</Text>
            </View>
          </CameraView>
        </View>

        <TouchableOpacity onPress={reset} className="items-center py-1">
          <Text className="text-gray-400 text-sm">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── PREVIEW ───────────────────────────────────────────────────────────────────
  if (step === "PREVIEW" && previewUri) {
    return (
      <View className="gap-3">
        <View className="rounded-2xl" style={{ height: 300 }}>
          <Image source={{ uri: previewUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          <View
            className="absolute top-3 left-3 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <Ionicons name="person-circle-outline" size={13} color="#fff" />
            <Text className="text-white text-xs font-semibold">Clock-In Photo</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => { setPreviewUri(null); setStep("CAMERA"); }}
            className="flex-1 py-3.5 rounded-lg flex-row items-center justify-center gap-1.5 bg-brand-secondary"
          >
            <Text className="text-white font-semibold">Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={submitClockIn}
            className="flex-1 py-3.5 rounded-lg flex-row items-center justify-center gap-1.5"
            style={{ backgroundColor: "#22C55E" }}
          >
            <Text className="text-white font-bold">Clock In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── UPLOADING ─────────────────────────────────────────────────────────────────
  if (step === "UPLOADING") {
    return (
      <View className="py-8 items-center gap-4">
        <ActivityIndicator size="large" color="#22C55E" />
        <View className="items-center gap-1">
          <Text className="text-gray-800 font-bold text-base">Clocking You In</Text>
          <Text className="text-gray-400 text-sm">Just a second...</Text>
        </View>
      </View>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────────
  if (step === "ERROR") {
    return (
      <View className="gap-4">
        <View
          className="rounded-2xl p-5 items-center gap-3"
          style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <Ionicons name="alert-circle-outline" size={34} color="#EF4444" />
          </View>
          <Text className="text-gray-800 font-bold text-lg">Something went wrong</Text>
          <Text className="text-gray-500 text-sm text-center leading-5">
            {errorMessage}
          </Text>
        </View>

        <TouchableOpacity
          onPress={reset}
          className="h-14 rounded-xl items-center justify-center"
          style={{ backgroundColor: "#0d1b3e" }}
        >
          <Text className="text-white font-bold text-base">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}