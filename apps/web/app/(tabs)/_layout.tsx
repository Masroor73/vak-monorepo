import { Stack } from "expo-router";
import { useAuthGuard } from "../../hooks/useAuthGuard";

export default function TabsLayout() {
  useAuthGuard();
  return <Stack screenOptions={{ headerShown: false }} />;
}