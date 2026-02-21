import { View, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import Menu from "../../assets/Menu.svg";
import Bell from "../../assets/Bell.svg";
import BlueBell from "../../assets/BlueBell.svg";
import WhiteBell from "../../assets/WhiteBell.svg";
import WhiteMenu from "../../assets/WhiteMenu.svg";

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
        paddingHorizontal: 20,
        backgroundColor: "black",
        zIndex: 50,
      }}
    >
      {/* Menu Button */}
      <Pressable onPress={toggleDrawer}  style={{marginRight: 18, marginTop: 20 }}>
        <Menu width={28} height={28} />
      </Pressable>

      <View style={{ flex: 1 }} />

      {/* Notifications Button */}
      <Pressable onPress={() => router.push("/(tabs)/notifications")}  style={{ marginTop: 20 }}>
        {isBellActive ? (
          <WhiteBell width={28} height={28} />
        ) : (
          <Bell width={28} height={28} />
        )}
      </Pressable>
    </View>
  );
}
