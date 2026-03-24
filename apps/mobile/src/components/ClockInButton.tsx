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

  const cameraRef = useRef<any>(null);
  const locationWatcher = useRef<any>(null);

  const RESTAURANT_LAT = 51.0447;
  const RESTAURANT_LNG = -114.0719;
  const ALLOWED_RADIUS = 500000000000;

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
      const publicUrlData = {
        data: { publicUrl: previewUri },
      };

      if (mode === "clockout") {
        await supabase
          .from("shifts")
          .update({
            clock_out_time: new Date().toISOString(),
            clock_out_photo_url: publicUrlData.data.publicUrl,
          })
          .eq("id", shiftId);
      } else {
        await supabase
          .from("shifts")
          .update({
            actual_start_time: new Date().toISOString(),
            clock_in_lat: location.latitude,
            clock_in_long: location.longitude,
            clock_in_photo_url: publicUrlData.data.publicUrl,
          })
          .eq("id", shiftId);
      }

      Alert.alert(mode === "clockout" ? "Clock-Out successful" : "Clock-In successful");
      onDone();
    } catch (err) {
      console.log(err);
      Alert.alert("Failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!permission?.granted && <Text>Camera permission required</Text>}
      {!hasLocationPerm && <Text>Location permission required</Text>}

      {distance !== null && distance <= ALLOWED_RADIUS ? (
        <>
          {!previewUri ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front">
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <Text style={styles.captureText}>Capture</Text>
              </TouchableOpacity>
            </CameraView>
          ) : (
            <>
              <Image source={{ uri: previewUri }} style={styles.preview} />

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