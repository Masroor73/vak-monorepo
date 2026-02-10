//apps/mobile/app/(tabs)/profile.tsx
import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { ShiftStatusCard, PrimaryButton, TextField, StatusBadge } from "@vak/ui";
import { useAuth } from "../../context/AuthContext"; // Importing useAuth to access signOut function
import { useRouter } from "expo-router"; // For navigation if needed

export default function Profile() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signOut, session, user } = useAuth(); // Accessing session, user, and signOut function from context
  const router = useRouter(); // Router for navigation (optional if you want to navigate after logout)

  const handleLogout = async () => {
    try {
      await signOut(); // Log the user out

      // Redirect to login page after logout
      router.replace("/(public)/login"); // Adjust path based on your routing setup
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Failed to log out. Please try again.");
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-damascus-background">
      <Text className="text-2xl font-bold text-damascus-primary mb-8">Profile Page</Text>

      {/* NEW: STATUS BADGE GALLERY */}
      <View className="flex-row gap-2 mb-6 flex-wrap justify-center">
        <StatusBadge status="DRAFT" />
        <StatusBadge status="PUBLISHED" />
        <StatusBadge status="COMPLETED" />
        <StatusBadge status="VOID" />
        <StatusBadge status="UNKNOWN_STATE" />
      </View>

      <ShiftStatusCard
        title="Prep Shift"
        subtitle="Feb 3, 9:00 AM - 2:00 PM"
        status="pending"
      />

      {/* TextFields for testing */}
      <TextField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        errorText={email === "" ? "Email is required" : ""}
      />

      <TextField
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* PrimaryButton for testing */}
      <PrimaryButton
        title="Confirm Shift"
        variant="primary"
        onPress={() => Alert.alert("Primary Button Pressed")}
        isLoading={false}
      />

      {/* Logout Button */}
      <PrimaryButton
        title="Logout"
        onPress={handleLogout}
        isLoading={false}
      />
    </View>
  );
}
