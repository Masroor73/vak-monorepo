import { View, TouchableOpacity, Text } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Tab = {
  key: string;
  basePaths: string[];
  navigateTo: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs: Tab[] = [
    {
      key: "Index",
      basePaths: ["/", "/index", "/(tabs)"],
      navigateTo: "/(tabs)",
      label: "Home",
      icon: "home-outline",
      iconActive: "home",
    },
    {
      key: "reports",
      basePaths: ["/(tabs)/report", "/report"],
      navigateTo: "/(tabs)/report",
      label: "Report",
      icon: "document-text-outline",
      iconActive: "document-text",
    },
    {
      key: "swap",
      basePaths: ["/(tabs)/swap", "/swap"],
      navigateTo: "/(tabs)/swap",
      label: "Swap",
      icon: "swap-horizontal-outline",
      iconActive: "swap-horizontal",
    },
    {
      key: "profile",
      basePaths: ["/(tabs)/profile", "/profile"],
      navigateTo: "/(tabs)/profile",
      label: "Profile",
      icon: "person-outline",
      iconActive: "person",
    },
  ];

  const isTabActive = (tab: Tab): boolean => {
    if (tab.key === "Index") return tab.basePaths.some((b: string) => pathname === b);
    return tab.basePaths.some((b: string) => pathname.startsWith(b));
  };

  return (
    <View
      style={{
        width: "100%",
        height: 85,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "#0d1b3e",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.07)",
        paddingBottom: 8,
      }}
    >
      {tabs.map((tab: Tab) => {
        const isActive = isTabActive(tab);
        return (
          <TouchableOpacity
            key={tab.navigateTo}
            onPress={() => router.push(tab.navigateTo as any)}
            style={{
              alignItems: "center",
              gap: 3,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: isActive ? "rgba(59,158,255,0.15)" : "transparent",
            }}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={22}
              color={isActive ? "#3b9eff" : "rgba(255,255,255,0.75)"}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isActive ? "#3b9eff" : "rgba(255,255,255,0.75)",
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}