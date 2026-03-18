import { View } from "react-native";
import { Stack, useRouter } from "expo-router";
import TopNavigation from "../../src/components/TopNav";
import { useAuth } from "../../context/AuthContext";
import BottomNavigation from "../../src/components/BottomNav";
import Drawer from "../../src/components/Drawer";
import { useShiftsRealtimeSubscription } from "../../hooks/useShiftsRealtimeSubscription";

import { useState, useEffect } from "react";

/** Mounted when user is in tabs; subscribes to shifts INSERT and invalidates shift queries. */
function ShiftsRealtimeListener() {
  useShiftsRealtimeSubscription();
  return null;
}

export default function TabsLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/(public)/login");
    }
  }, [session, loading]);

  return (
    <View style={{ flex: 1 }}>
      <ShiftsRealtimeListener />
      {/* Stack Navigation */}
      <Stack
        screenOptions={{
          header: () => <TopNavigation toggleDrawer={toggleDrawer} />,
          headerShown: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="report" />
        <Stack.Screen name="swap" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="editProfile" />
        <Stack.Screen name="mySchedule" />
      </Stack>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        toggleDrawer={toggleDrawer}
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </View>
  );
}
