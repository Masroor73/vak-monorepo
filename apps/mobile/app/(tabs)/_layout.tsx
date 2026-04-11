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
          header: ({ options }) => (
            <TopNavigation
              toggleDrawer={toggleDrawer}
              title={options.title}
              showBack={options.headerBackVisible ?? false}
            />
          ),
          headerShown: true,
        }}
      >
        {/* ── Bottom nav screens → hamburger, no title ── */}
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />

        {/* ── Drawer screens → back arrow + title ── */}
        <Stack.Screen name="dailyTasks" options={{ title: "Daily Tasks", headerBackVisible: true }} />
        <Stack.Screen name="recognition" options={{ title: "Recognition", headerBackVisible: true }} />
        <Stack.Screen name="setAvailability" options={{ title: "Set Availability", headerBackVisible: true }} />

        {/* Added by Carivaldo: legal pages opened from the drawer */}
        <Stack.Screen name="termsConditions" options={{ title: "Terms & Conditions", headerBackVisible: true }} />
        <Stack.Screen name="privacyPolicy" options={{ title: "Privacy Policy", headerBackVisible: true }} />

        {/* ── Stack-pushed screens → back arrow + title ── */}
        <Stack.Screen name="report" options={{ title: "Report", headerBackVisible: false }} />
        <Stack.Screen name="swap" options={{ title: "Swap Shift", headerBackVisible: false }} />
        <Stack.Screen name="editProfile" options={{ title: "Edit Profile", headerBackVisible: true }} />
        <Stack.Screen name="mySchedule" options={{ title: "My Schedule", headerBackVisible: true }} />
        <Stack.Screen name="shift/[id]" options={{ title: "Shift Details", headerBackVisible: true }} />
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