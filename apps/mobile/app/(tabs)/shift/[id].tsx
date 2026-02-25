// apps/mobile/app/(tabs)/shift/[id].tsx
import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";

const ShiftDetail = () => {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 items-center justify-center p-5 bg-white">
      <Text className="text-xl font-bold mb-4">Shift ID: {id}</Text>

      {/* Map placeholder */}
      <Image
        source={{ uri: "https://via.placeholder.com/300x200.png?text=Map" }}
        className="w-full h-48 rounded-lg mb-4"
      />

      {/* Notes placeholder */}
      <Text className="text-gray-500 mb-4">Notes: (placeholder)</Text>

      {/* Clock In button placeholder */}
      <Pressable
        className="bg-green-500 py-3 px-6 rounded-2xl"
        onPress={() => console.log("Clock In pressed for shift:", id)}
      >
        <Text className="text-white font-bold">Clock In</Text>
      </Pressable>
    </View>
  );
};

export default ShiftDetail;