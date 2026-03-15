import { View, TouchableOpacity } from "react-native";
import { useRouter, usePathname } from "expo-router";

// Normal SVGs
import Grid from "../../assets/Grid.svg";
import Alert from "../../assets/Alert.svg";
import MessageCircle from "../../assets/MessageCircle.svg";
import AccountCircle from "../../assets/AccountCircle.svg";

// Blue SVGs
import WhiteGrid from "../../assets/WhiteGrid.svg";
import WhiteAlert from "../../assets/WhiteAlert.svg";
import WhiteMessageCircle from "../../assets/WhiteMessageCircle.svg";
import WhiteAccountCircle from "../../assets/WhiteAccountCircle.svg";


type Tab = {
  key: string;
  basePaths: string[];
  navigateTo: string;
  Svg: any;     
  WhiteSvg: any;  
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
      WhiteSvg: WhiteGrid,
    },
    {
      key: "reports",
      basePaths: ["/(tabs)/report", "/report"],
      navigateTo: "/(tabs)/report",
      Svg: Alert,
      WhiteSvg: WhiteAlert,
    },
    {
      key: "messages",
      basePaths: ["/(tabs)/messages", "/messages"],
      navigateTo: "/(tabs)/messages",
      Svg: MessageCircle,
      WhiteSvg: WhiteMessageCircle,
    },
    {
      key: "profile",
      basePaths: ["/(tabs)/profile", "/profile"],
      navigateTo: "/(tabs)/profile",
      Svg: AccountCircle,
      WhiteSvg: WhiteAccountCircle,
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
        const Icon = isActive ? tab.WhiteSvg : tab.Svg;

        return (
          <TouchableOpacity
            key={tab.navigateTo}
            onPress={() => router.push(tab.navigateTo as any)}
          >
            <View className="p-2 items-center justify-center"  style={{ marginHorizontal: 20}}>
              <Icon width={45} height={45}/>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

