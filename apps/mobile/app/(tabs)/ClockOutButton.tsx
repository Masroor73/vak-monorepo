import React from "react";
import { Alert } from "react-native";
import { PrimaryButton } from "@vak/ui";
import { supabase } from "../../lib/supabase";

type Props = {
  shiftId: string;
  onDone?: () => void;
};

export default function ClockOutButton({ shiftId, onDone }: Props) {

  const handleClockOut = async () => {
    try {
      console.log("Clock out clicked:", shiftId);

      // ✅ ONLY USE SAFE COLUMN (this works in your DB)
      const { error } = await supabase
        .from("shifts")
        .update({
          actual_end_time: new Date().toISOString(),
          status: "COMPLETED",
        })
        .eq("id", shiftId);

      if (error) {
        console.log("Supabase error:", error);
        Alert.alert("Clock Out Failed", error.message);
        return;
      }

      Alert.alert("Clocked Out Successfully");

      // 🔥 refresh parent UI
      onDone?.();

    } catch (err) {
      console.log("Unexpected error:", err);
      Alert.alert("Something went wrong");
    }
  };

  return (
    <PrimaryButton
      title="Clock Out"
      onPress={handleClockOut}
    />
  );
}