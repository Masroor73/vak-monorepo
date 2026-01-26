import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-damascus-background">
      <Text className="text-4xl font-bold text-damascus-primary">
        Manager Dashboard
      </Text>
      <Text className="text-xl text-damascus-text mt-4">
        Squad B: Operational
      </Text>
    </View>
  );
}