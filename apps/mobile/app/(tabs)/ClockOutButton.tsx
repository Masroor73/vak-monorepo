import { Alert } from "react-native";
import { PrimaryButton } from "@vak/ui";
import { supabase } from "../../lib/supabase";

type ClockOutButtonProps = {
  shiftId: string;
  userId: string;
  onDone?: () => void;
};

export default function ClockOutButton({
  shiftId,
  userId,
  onDone,
}: ClockOutButtonProps) {

  const handleClockOut = async () => {

    const { error } = await supabase
      .from("shifts")
      .update({
        actual_end_time: new Date().toISOString(),
        status: "COMPLETED",
      })
      .eq("id", shiftId);

    if (error) {
      Alert.alert("Clock Out Failed");
      return;
    }

    Alert.alert("Clocked Out Successfully");

    onDone?.();
  };

  return (
    <PrimaryButton 
      title="Clock Out"
      onPress={handleClockOut}
    />
  );
}