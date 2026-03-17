import { Pressable, Text, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function ClockOutButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClockOut = async () => {
    if (!user) {
  Alert.alert("Error", "User not logged in");
  setLoading(false);
  return;
}
    try {
      setLoading(true);

      // find active shift
      const { data: shift, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("employee_id", user.id)
        .is("clock_out_time", null)
        .single();

      if (error || !shift) {
        Alert.alert("Error", "No active shift found.");
        setLoading(false);
        return;
      }

      // update clock out time
      const { error: updateError } = await supabase
        .from("shifts")
        .update({
          clock_out_time: new Date().toISOString(),
        })
        .eq("id", shift.id);

      if (updateError) {
        Alert.alert("Error", updateError.message);
      } else {
        Alert.alert("Success", "You clocked out successfully.");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <Pressable
      onPress={handleClockOut}
      style={{
        backgroundColor: "#ef4444",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
      }}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={{ color: "white", fontWeight: "600" }}>
          Clock Out
        </Text>
      )}
    </Pressable>
  );
}