import { Stack } from "expo-router";
import BottomNavigation from "../../src/components/BottomNav";
import TopNavigation from "../../src/components/TopNav";

export default function TabsLayout() {
  return (
    <>
      {/* Top Navigation Bar (e.g., bell icon) */}
      <TopNavigation />

      {/* Main Stack Navigation */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Define the screens in the tab layout */}
        <Stack.Screen name="index" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="profile" />
      </Stack>

      {/* Bottom Navigation Bar */}
      <BottomNavigation />
    </>
  );
}
