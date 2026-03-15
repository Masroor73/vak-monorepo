
//apps/mobile/app/(tabs)/profile.tsx
import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import Header from "@/src/components/Header";
import UserInfo from "@/src/components/UserInfo";
import NotificationBottomSheet from "@/src/components/NotificationBottomSheet";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

type Tab = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function TabItem({ icon, label, onPress }: Tab) {
  return (
    <TouchableOpacity className="flex-row items-center py-5 border-b border-gray-600" onPress={onPress}>
      <Ionicons name={icon} size={24} />
      <Text className="ml-4">{label}</Text>
    </TouchableOpacity>
  );
}

const Profile = () => {
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);

  const handleOpenNotification = useCallback(() => {
    setIsNotificationSheetOpen(true);
  }, []);

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
      onPress: handleOpenNotification,
    },
    {
      icon: "help-circle-outline",
      label: "Help and Support",
      onPress: () => {},
    },
  ];

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView>
          <Header title="My Profile" />
          <UserInfo />
          <View className="px-8 mt-2">
            {tabs.map((item, index) => (
              <TabItem key={index} icon={item.icon} label={item.label} onPress={item.onPress} />
            ))}
          </View>
        </ScrollView>

        <NotificationBottomSheet open={isNotificationSheetOpen} onClose={() => setIsNotificationSheetOpen(false)} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Profile;
