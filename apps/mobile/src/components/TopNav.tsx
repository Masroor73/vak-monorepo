import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import Bell from "../../assets/Bell.svg"; // Default bell icon

export default function TopNavigation() {
  const router = useRouter();

  // Handle bell click event
  const handleBellClick = () => {
    // Navigate to the notifications screen
    router.push("/(tabs)/notifications");
  };

  return (
      <View className="w-full h-20 bg-black flex-row items-center px-4">
      <TouchableOpacity onPress={handleBellClick}>
        <View className="ml-auto"> 
          <Bell className="w-[30px] h-[30px] text-white" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
