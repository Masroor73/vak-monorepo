import { View } from "react-native";
import { Stack, useRouter } from "expo-router";
import TopNavigation from "../../src/components/TopNav";
import { useAuth } from "../../context/AuthContext";
import BottomNavigation from "../../src/components/BottomNav";
import Drawer from "../../src/components/Drawer";
import { useShiftsRealtimeSubscription } from "../../hooks/useShiftsRealtimeSubscription";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";
import { useDrawerBadges } from "../../hooks/useDrawerBadges";
import { BadgeContext } from "../../context/BadgeContext";
import { useState, useEffect } from "react";

function ShiftsRealtimeListener() {
  useShiftsRealtimeSubscription();
  return null;
}

export default function TabsLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);
  const { session, loading } = useAuth();
  const router = useRouter();
  const unreadCount = useUnreadNotifications();
  const {
    pendingTasksCount,
    newRecognitionCount,
    clearTasksBadge,
    clearRecognitionBadge,
  } = useDrawerBadges();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace("/(public)/login");
  }, [session, loading]);

  return (
    <BadgeContext.Provider value={{ clearTasksBadge, clearRecognitionBadge }}>
      <View style={{ flex: 1, paddingBottom: 0 }} >
        <ShiftsRealtimeListener />
        <Stack
          screenOptions={{
            header: ({ options }) => (
              <TopNavigation
                toggleDrawer={toggleDrawer}
                title={options.title}
                showBack={options.headerBackVisible ?? false}
                unreadCount={unreadCount}
                hasDrawerAlert={pendingTasksCount > 0 || newRecognitionCount > 0}
              />
            ),
            headerShown: true,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="profile" options={{ title: "Profile" }} />
          <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
          <Stack.Screen name="dailyTasks"      options={{ title: "Daily Tasks",      headerBackVisible: true }} />
          <Stack.Screen name="recognition"     options={{ title: "Recognition",      headerBackVisible: true }} />
          <Stack.Screen name="setAvailability" options={{ title: "Set Availability", headerBackVisible: true }} />
          <Stack.Screen name="clock-history"   options={{ title: "Clock History",    headerBackVisible: true }} />
          <Stack.Screen name="report"          options={{ title: "Report",           headerBackVisible: false }} />
          <Stack.Screen name="swap"            options={{ title: "Shift Swap",       headerBackVisible: false }} />
          <Stack.Screen name="editProfile"     options={{ title: "Edit Profile",     headerBackVisible: true }} />
          <Stack.Screen name="mySchedule"      options={{ title: "My Schedule",      headerBackVisible: true }} />
          <Stack.Screen name="shift/[id]"      options={{ title: "Shift Details",    headerBackVisible: true }} />
        </Stack>

        <Drawer
          isOpen={isDrawerOpen}
          toggleDrawer={toggleDrawer}
          pendingTasksCount={pendingTasksCount}
          newRecognitionCount={newRecognitionCount}
        />
        <BottomNavigation />
      </View>
    </BadgeContext.Provider>
  );
}