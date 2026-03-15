//web/app/(public)/_layout.tsx
import { Stack } from "expo-router";

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="SignUp" />
      <Stack.Screen name="pendingApproval" />
    </Stack>
  );
}