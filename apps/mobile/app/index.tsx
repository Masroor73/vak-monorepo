import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-damascus-background">
      <Text className="text-3xl font-bold text-damascus-primary">
        V.A.K Online
      </Text>
      <View className="h-4 w-4 bg-damascus-secondary rounded-full mt-4" />
      <Text className="text-damascus-muted mt-2">
        System Operational
      </Text>
    </View>
  );
}