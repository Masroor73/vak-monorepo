import { View, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import Menu from "../../assets/Menu.svg";
import Bell from "../../assets/Bell.svg";
import BlueBell from "../../assets/BlueBell.svg";

type Props = {
  toggleDrawer: () => void;
};

export default function TopNavigation({ toggleDrawer }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Paths where bell should be blue
  const bellPaths = ["/notification"];

  // Check if the current pathname starts with any of the bell paths
  // This automatically handles trailing slashes or nested routes
  const isBellActive = bellPaths.some(path => pathname?.startsWith(path));

  return (
    <View
      style={{
        width: "100%",
        height: 110,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        backgroundColor: "black",
        zIndex: 50,
      }}
    >
      {/* Menu Button */}
      <Pressable onPress={toggleDrawer}>
        <Menu width={32} height={32} />
      </Pressable>

      <View style={{ flex: 1 }} />

      {/* Notifications Button */}
      <Pressable onPress={() => router.push("/(tabs)/notifications")}>
        {isBellActive ? (
          <BlueBell width={32} height={32} />
        ) : (
          <Bell width={32} height={32} />
        )}
      </Pressable>
    </View>
  );
}
