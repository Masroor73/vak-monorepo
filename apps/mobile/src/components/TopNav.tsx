import { View, Pressable, Text } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  toggleDrawer: () => void;
  title?: string;
  showBack?: boolean;
};

export default function TopNavigation({ toggleDrawer, title, showBack = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isBellActive = pathname?.startsWith("/notification");

  return (
    <View
      style={{
        width: "100%",
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0d1b3e",
        borderBottomWidth: 1,
        borderBottomColor: "#00000005",
        zIndex: 50,
      }}
    >
      {/* Left — back arrow or hamburger */}
      {showBack ? (
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.85)" />
        </Pressable>
      ) : (
        <Pressable onPress={toggleDrawer} hitSlop={8}>
          <Ionicons name="menu-outline" size={28} color="rgba(255,255,255,0.85)" />
        </Pressable>
      )}

      {/* Center — title if provided */}
      {title ? (
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 16,
            fontWeight: "600",
            color: "#ffffff",
            letterSpacing: -0.2,
            marginHorizontal: 12,
          }}
        >
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {/* Right — bell */}
      <Pressable
        onPress={() => router.push("/(tabs)/notifications")}
        hitSlop={8}
        style={{
          padding: 6,
          borderRadius: 10,
          backgroundColor: isBellActive ? "rgba(58,154,255,0.15)" : "transparent",
        }}
      >
        <Ionicons
          name="notifications-outline"
          size={24}
          color={isBellActive ? "#3A9AFF" : "rgba(255,255,255,0.85)"}
        />
      </Pressable>
    </View>
  );
}