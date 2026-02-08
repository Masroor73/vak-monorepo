// src/components/BottomNavigation.tsx
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";

// Import your SVGs based on the provided names
import MessageCircle from "../../assets/MessageCircle.svg";
import Grid from "../../assets/Grid.svg";
import BlackMessageCircle from "../../assets/BlackMessageCircle.svg";
import BlackGrid from "../../assets/BlackGrid.svg";
import BlackAlert from "../../assets/BlackAlert.svg";
import BlackAccountCircle from "../../assets/BlackAccountCircle.svg";
import Alert from "../../assets/Alert.svg";
import AccountCircle from "../../assets/AccountCircle.svg";

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
  {
    key: "Index",
    path: "/(tabs)",  // Path to Dashboard screen
    Svg: Grid,
    BlackSvg: BlackGrid,
    disabled: false, // Add disabled property
  },
  {
    key: "alerts",
    path: "/(tabs)/alerts",  // Path to Alerts screen
    Svg: Alert,
    BlackSvg: BlackAlert,
    disabled: false, // Add disabled property
  },
  {
    key: "messages",
    path: "/(tabs)/messages",  // Path to Messages screen
    Svg: MessageCircle,
    BlackSvg: BlackMessageCircle,
    disabled: false, // Example: Disable this tab
  },
  {
    key: "profile",
    path: "/(tabs)/profile",  // Path to Profile screen
    Svg: AccountCircle,
    BlackSvg: BlackAccountCircle,
    disabled: false, // Add disabled property
  },
];

 return (
    <View className="absolute bottom-0 w-full h-20 bg-black flex-row items-center justify-around px-4">
      {tabs.map(({ path, Svg, BlackSvg, disabled }) => {
        const isActive = pathname === path;
        const Icon = isActive ? BlackSvg : Svg;

        return (
          <TouchableOpacity
            key={path}
            onPress={() => !disabled && router.push(path)} 
            disabled={disabled}
          >
            <View
              className="p-2 rounded-xl padding"
              style={{ marginHorizontal: 25 }} 
            >
              <Icon className="w-[35px] h-[35px]"/>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}