import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { supabase } from "../../lib/supabase";

type Props = {
  shiftId: string;
  userId: string;
  onDone: () => void;
  mode?: "clockin" | "clockout";
};

export default function ClockInButton({
  shiftId,
  userId,
  onDone,
  mode = "clockin",
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasLocationPerm, setHasLocationPerm] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(true);

  const cameraRef = useRef<any>(null);
  const locationWatcher = useRef<any>(null);

  const RESTAURANT_LAT = 51.0447;
  const RESTAURANT_LNG = -114.0719;
  const ALLOWED_RADIUS = 5000000000;

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    (async () => {
      await requestPermission();

      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPerm(status === "granted");

      if (status === "granted") {
        locationWatcher.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 1 },
          (loc: any) => {
            const coords = loc.coords;
            setLocation(coords);

            const dist = calculateDistance(
              coords.latitude,
              coords.longitude,
              RESTAURANT_LAT,
              RESTAURANT_LNG
            );

            setDistance(Math.round(dist));
          }
        );
      }
    })();

    return () => {
      if (locationWatcher.current) {
        locationWatcher.current.remove();
      }
    };
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    setPreviewUri(photo.uri);
  };

  const handleSubmit = async () => {
    if (!previewUri) {
      Alert.alert("Missing photo");
      return;
    }

    setUploading(true);

    try {

      // ✅ ONLY for clock-in (not clock-out)
if (mode !== "clockout") {
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("end_time, actual_start_time")
    .eq("id", shiftId)
    .single();

  if (shiftError || !shift) {
    Alert.alert("Failed to load shift");
    setUploading(false);
    return;
  }

  // ❌ Prevent double clock-in
  if (shift.actual_start_time) {
    Alert.alert("You have already clocked in for this shift");
    setUploading(false);
    return;
  }

  // ❌ Prevent late clock-in
  if (new Date() > new Date(shift.end_time)) {
    Alert.alert("Cannot clock in after shift has ended");
    setUploading(false);
    return;
  }
}

      console.log("Image URI:", previewUri);

// Convert to arrayBuffer (THIS IS THE FIX)
// Convert image to arrayBuffer
const response = await fetch(previewUri);
const arrayBuffer = await response.arrayBuffer();

// Correct path (must use userId)
const filePath = `${userId}/${Date.now()}.jpg`;

const { error: uploadError } = await supabase.storage
  .from("shift-proofs")
  .upload(filePath, arrayBuffer, {
    contentType: "image/jpeg",
  });

if (uploadError) {
  console.log("UPLOAD ERROR:", uploadError);
  Alert.alert("Upload failed");
  setUploading(false);
  return;
}

// Get public URL
const { data: publicUrlData } = supabase.storage
  .from("shift-proofs")
  .getPublicUrl(filePath);

const photoUrl = publicUrlData.publicUrl;

if (!photoUrl) {
  Alert.alert("Failed to get image URL");
  setUploading(false);
  setPreviewUri(null);
  return;
}

console.log("Upload success:", photoUrl);

      if (mode === "clockout") {
        await supabase
          .from("shifts")
          .update({
            clock_out_time: new Date().toISOString(),
            clock_out_photo_url: photoUrl
          })
          .eq("id", shiftId);
      } else {
        await supabase
          .from("shifts")
          .update({
            actual_start_time: new Date().toISOString(),
            clock_in_lat: location?.latitude ?? null,
            clock_in_long: location?.longitude ?? null,
            clock_in_photo_url: photoUrl
          })
          .eq("id", shiftId);
      }

      Alert.alert(mode === "clockout" ? "Clock-Out successful" : "Clock-In successful");
      setPreviewUri(null);
      setShowCamera(false);
      onDone();
    } catch (err) {
      console.log(err);
      Alert.alert("Failed");
      setPreviewUri(null);
    } 
      finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!permission?.granted && <Text>Camera permission required</Text>}
      {!hasLocationPerm && <Text>Location permission required</Text>}

      {distance !== null && distance <= ALLOWED_RADIUS ? (
        <>
        {showCamera && !previewUri ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front">
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <Text style={styles.captureText}>Capture</Text>
              </TouchableOpacity>
            </CameraView>
          ) : (
            <>
              {previewUri && (
              <Image source={{ uri: previewUri }} style={styles.preview} />
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => setPreviewUri(null)}>
                  <Text style={styles.cancel}>Retake</Text>
                </TouchableOpacity>

                {uploading ? (
                  <ActivityIndicator size="large" />
                ) : (
                  <TouchableOpacity onPress={handleSubmit}>
                    <Text style={styles.submit}>Submit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </>
      ) : (
        <Text style={styles.tooFar}>Walk closer to workplace</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", padding: 10 },
  camera: { height: 300, borderRadius: 12, overflow: "hidden" },

  captureButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#1E40AF",
    padding: 16,
    borderRadius: 40,
  },

  captureText: { color: "#fff", fontWeight: "700" },

  preview: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginTop: 20,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  cancel: { color: "red", fontWeight: "700" },
  submit: { color: "green", fontWeight: "700" },

  tooFar: { color: "#D00", textAlign: "center", marginTop: 10 },
});