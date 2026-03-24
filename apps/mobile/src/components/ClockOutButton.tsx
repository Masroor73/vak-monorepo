import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView } from "expo-camera";
import { supabase } from "../../lib/supabase";

type Props = {
  shiftId: string;
  onDone: () => void;
};

export default function ClockOutButton({ shiftId, onDone }: Props) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const cameraRef = useRef<any>(null);

  // 📸 Take photo
  const takePicture = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync();
    setPreviewUri(photo.uri);
  };

  // 🚀 Submit clock out
  const submitClockOut = async () => {
    if (!previewUri) {
      Alert.alert("Take photo first");
      return;
    }

    try {
      setUploading(true);

      await supabase
        .from("shifts")
        .update({
          clock_out_time: new Date().toISOString(),
          clock_out_photo_url: previewUri,
        })
        .eq("id", shiftId);

      Alert.alert("Clock-Out Successful");
      onDone();
    } catch (err) {
      console.log(err);
      Alert.alert("Error clocking out");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
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
              <TouchableOpacity onPress={submitClockOut}>
                <Text style={styles.submit}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", padding: 10 },

  camera: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
  },

  captureButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#1E40AF",
    padding: 16,
    borderRadius: 40,
  },

  captureText: {
    color: "#fff",
    fontWeight: "700",
  },

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

  cancel: {
    color: "red",
    fontWeight: "700",
  },

  submit: {
    color: "green",
    fontWeight: "700",
  },
});