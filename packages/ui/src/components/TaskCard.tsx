import { View, Text } from "react-native";

interface TaskCardProps {
  title: string;
  priority: "low" | "medium" | "high";
}

export const TaskCard = ({ title, priority }: TaskCardProps) => {
  // Left border color based on priority
  const borderColor =
    priority === "high"
      ? "red"
      : priority === "medium"
      ? "orange"
      : "green";

  return (
    <View className="flex-row items-center rounded-xl mb-4 overflow-hidden border border-gray-400">
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
        <Text className="text-base">{title}</Text>
      </View>
    </View>
  );
};