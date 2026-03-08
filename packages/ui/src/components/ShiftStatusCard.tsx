import { View, Text } from "react-native";

interface ShiftStatusCardProps {
  title: string;
  subtitle: string;
  swapStatus?: 'pending' | 'approved' | 'denied';
}

export const ShiftStatusCard = ({ title, subtitle, swapStatus }: ShiftStatusCardProps) => {
  const dotColor =
    swapStatus === 'approved' ? '#16a34a' :
    swapStatus === 'denied' ? '#b91c1c' :
    swapStatus === 'pending' ? '#facc15' :
    null;

  return (
    <View className="flex-row h-24 w-[90%] max-w-md bg-white border-2 border-gray-300 rounded-s shadow-md mb-6 items-center overflow-hidden mx-auto">
      
      {/* Content */}
      <View className="flex-1 px-5 justify-center">
        <Text className="text-lg font-bold text-gray-800">{title}</Text>
        <Text className="text-gray-500 mt-1">{subtitle}</Text>
      </View>

      {/* Show the dot only if swapStatus exists */}
      {dotColor && (
        <View
          className="w-4 h-4 rounded-full mr-5"
          style={{ backgroundColor: dotColor }}
        />
      )}
    </View>
  );
};