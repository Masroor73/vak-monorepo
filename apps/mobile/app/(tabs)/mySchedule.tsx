// apps/mobile/app/(tabs)/mySchedule.tsx
import { View, Text } from "react-native";

export default function MySchedule() {
  return (
    <View className="flex-1 items-center justify-center bg-damascus-background">
      <Text className="text-2xl font-bold text-damascus-text">My Schedule</Text>
      <Text className="mt-2 text-gray-500">This is your schedule page.</Text>
    </View>
  );
}