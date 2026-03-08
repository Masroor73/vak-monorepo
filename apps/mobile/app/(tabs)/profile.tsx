import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Header from "@/src/components/Header";
import UserInfo from "@/src/components/UserInfo";
import { Ionicons } from "@expo/vector-icons";

type Tab = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function Tab({ icon, label, onPress }: Tab) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-5 border-b border-gray-200"
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color="#333" />
      <Text className="ml-4 text-base">{label}</Text>
    </TouchableOpacity>
  );
}

const Profile = () => {
  const router = useRouter();

  const tabs: Tab[] = [
    {
      icon: "calendar-outline",
      label: "Set Availability",
      onPress: () => router.push("/availability"),
    },
    {
      icon: "trophy-outline",
      label: "Recognition",
      onPress: () => router.push("/recognition"),
    },
    {
      icon: "globe-outline",
      label: "Location",
      onPress: () => {},
    },
    {
      icon: "shield-outline",
      label: "Privacy Policy",
      onPress: () => {},
    },
    {
      icon: "settings-outline",
      label: "Notification Preferences",
      onPress: () => {},
    },
    {
      icon: "help-circle-outline",
      label: "Help and Support",
      onPress: () => {},
    },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <Header title="My Profile" />

      <UserInfo />

      <View className="px-8 mt-2">
        {tabs.map((item, index) => (
          <Tab
            key={index}
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default Profile;