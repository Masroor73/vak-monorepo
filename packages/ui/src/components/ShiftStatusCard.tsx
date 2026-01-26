import { View, Text } from "react-native";

// Define strict props for TypeScript safety
interface ShiftStatusCardProps {
  title: string;
  subtitle: string;
  status: 'pending' | 'approved' | 'denied';
}

export const ShiftStatusCard = ({ title, subtitle, status }: ShiftStatusCardProps) => {
  // Logic for dynamic colors
  const dotColor = 
    status === 'approved' ? 'bg-green-600' : 
    status === 'denied' ? 'bg-red-700' : 'bg-yellow-400';

  return (
    <View className="flex-row h-20 w-[90%] max-w-md bg-white border border-gray-300 rounded-xl shadow-sm mb-4 items-center overflow-hidden mx-auto">
      {/* Left Decoration Line */}
      <View className="w-4 h-full bg-damascus-primary" />

      {/* Content */}
      <View className="flex-1 px-4 justify-center">
        <Text className="text-lg font-bold text-gray-800">{title}</Text>
        <Text className="text-gray-500">{subtitle}</Text>
      </View>

      {/* Status Dot */}
      <View className={`w-3 h-3 rounded-full mr-4 ${dotColor}`} />
    </View>
  );
};