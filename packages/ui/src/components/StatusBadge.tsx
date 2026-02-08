import { View, Text } from "react-native";

// Strictly typed the status to match Enums (or generic strings for flexibility)
type StatusType = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'VOID' | string;

interface StatusBadgeProps {
  status: StatusType;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  // 1. Determine Color Logic based on Status
  const getBadgeStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PUBLISHED':
        return { container: 'bg-blue-100 border-blue-300', text: 'text-blue-800' };
      case 'COMPLETED':
        return { container: 'bg-green-100 border-green-300', text: 'text-green-800' };
      case 'VOID':
        return { container: 'bg-red-100 border-red-300', text: 'text-red-800' };
      case 'DRAFT':
      default:
        return { container: 'bg-gray-100 border-gray-300', text: 'text-gray-800' };
    }
  };

  const styles = getBadgeStyle(status);

  return (
    <View className={`border rounded-full px-3 py-1 self-start ${styles.container}`}>
      <Text className={`text-xs font-bold uppercase tracking-wide ${styles.text}`}>
        {status}
      </Text>
    </View>
  );
};