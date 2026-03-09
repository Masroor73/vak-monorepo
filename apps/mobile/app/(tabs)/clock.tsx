import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ClockInButton from "../../src/components/ClockInButton";

export default function ClockScreen() {

  const handleClockInDone = () => {
    console.log("Clock in completed");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clock-In</Text>

      <Text style={styles.subtitle}>
        You can clock in from here.
      </Text>

      <ClockInButton
        shiftId="test-shift-1"
        userId="demo-user-1"
        onDone={handleClockInDone}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20
  }
});