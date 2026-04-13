import { View, Pressable, Text } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  toggleDrawer: () => void;
  title?: string;
  showBack?: boolean;
  unreadCount?: number;
  hasDrawerAlert?: boolean;
};

export default function TopNavigation({
  toggleDrawer,
  title,
  showBack,
  unreadCount = 0,
  hasDrawerAlert = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isBellActive = pathname?.startsWith("/notification");
  const badgeCount = unreadCount > 99 ? "99+" : String(unreadCount);

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
          <View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="menu-outline" size={28} color="rgba(255,255,255,0.85)" />
            {hasDrawerAlert && (
              <View
                style={{
                  position: "absolute",
                  top: 5,
                  right: 3,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#e74c3c",
                  borderWidth: 1.5,
                  borderColor: "#0d1b3e",
                }}
              />
            )}
          </View>
        </Pressable>
      )}

      {/* Center — title */}
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

      {/* Right — bell with badge */}
      <Pressable
        onPress={() => router.push("/(tabs)/notifications")}
        hitSlop={8}
        style={{
          padding: 6,
          borderRadius: 10,
          backgroundColor: isBellActive ? "rgba(58,154,255,0.15)" : "transparent",
        }}
      >
        <View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={isBellActive ? "#3A9AFF" : "rgba(255,255,255,0.85)"}
          />
          {unreadCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                backgroundColor: "#e74c3c",
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
                borderWidth: 1.5,
                borderColor: "#0d1b3e",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                {badgeCount}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}