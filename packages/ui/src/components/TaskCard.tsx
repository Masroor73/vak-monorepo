import { View, Text, Pressable } from "react-native";

interface TaskCardProps {
  title: string;
  priority: "low" | "medium" | "high";
  onPress?: () => void;
}

export const TaskCard = ({ title, priority, onPress }: TaskCardProps) => {
  // Left border color based on priority
  const borderColor =
    priority === "high"
      ? "red"
      : priority === "medium"
        ? "orange"
        : "green";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-xl mb-4 overflow-hidden border border-gray-400"
    >
      {/* Left colored bar */}
      <View
        className="h-full"
        style={{
          width: 8,
          backgroundColor: borderColor,
        }}
      />

      {/* Content */}
      <View className="flex-1 px-5 py-5">
        <Text className="text-base text-gray-200">{title}</Text>
      </View>
    </Pressable>
  );
};