import { View, TouchableOpacity } from "react-native";
import { useRouter, usePathname } from "expo-router";

// Normal SVGs
import Grid from "../../assets/Grid.svg";
import Alert from "../../assets/Alert.svg";
import MessageCircle from "../../assets/MessageCircle.svg";
import AccountCircle from "../../assets/AccountCircle.svg";

// Blue SVGs
import BlueGrid from "../../assets/BlueGrid.svg";
import BlueAlert from "../../assets/BlueAlert.svg";
import BlueMessageCircle from "../../assets/BlueMessageCircle.svg";
import BlueAccountCircle from "../../assets/BlueAccountCircle.svg";

type Tab = {
  key: string;
  basePaths: string[];
  navigateTo: string;
  Svg: any;     
  BlueSvg: any;  
};

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs: Tab[] = [
    
    {
      key: "Index",
      basePaths: ["/",  "/index", "/(tabs)"], // Include /index
      navigateTo: "/(tabs)",
      Svg: Grid,
      BlueSvg: BlueGrid,
    },
    {
      key: "reports",
      basePaths: ["/(tabs)/report", "/report"],
      navigateTo: "/(tabs)/report",
      Svg: Alert,
      BlueSvg: BlueAlert,
    },
    {
      key: "messages",
      basePaths: ["/(tabs)/messages", "/messages"],
      navigateTo: "/(tabs)/messages",
      Svg: MessageCircle,
      BlueSvg: BlueMessageCircle,
    },
    {
      key: "profile",
      basePaths: ["/(tabs)/profile", "/profile"],
      navigateTo: "/(tabs)/profile",
      Svg: AccountCircle,
      BlueSvg: BlueAccountCircle,
    },
  ];

  const isTabActive = (tab: Tab): boolean => {
    if (tab.key === "Index") {
      return tab.basePaths.some((base: string) => pathname === base);
    }
    return tab.basePaths.some((base: string) => pathname.startsWith(base));
  };

  return (
    <View className="w-full flex-row justify-around items-center bg-black " style={{ height: 100 }}>
      {tabs.map((tab: Tab) => {
        const isActive = isTabActive(tab);
        const Icon = isActive ? tab.BlueSvg : tab.Svg;

        return (
          <TouchableOpacity
            key={tab.navigateTo}
            onPress={() => router.push(tab.navigateTo)}
          >
            <View className="p-2 items-center justify-center"  style={{ marginHorizontal: 30}}>
              <Icon width={45} height={45}/>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

