import { View, Pressable, Animated, Text, Dimensions, Alert } from "react-native"; 
import DrawerLogo from "../../assets/DrawerLogo.svg";
import { useRouter, usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get("window");
const DRAWER_WIDTH = 250;

type Props = {
  isOpen: boolean;
  toggleDrawer: () => void;
};

const menuItems = [
  { label: "Daily Tasks List", route: "/(tabs)/dailyTasks" },
  { label: "Recognition", route: "/(tabs)/recognition" },
  { label: "Set Availability", route: "/(tabs)/setAvailability" },
  { label: "Report Food Wastage", route: "/(tabs)/foodWastage" },
];

export default function Drawer({ isOpen, toggleDrawer }: Props) {
  const router = useRouter();
  const pathname = usePathname(); // Always current route
  const { signOut } = useAuth();

  const drawerAnim = useRef(new Animated.Value(isOpen ? 0 : -DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const navigateTo = (route: string) => {
    router.push(route);
    toggleDrawer();
  };

  const handleLogout = async () => {
    try {
      await signOut(); 
      router.replace("/(public)/login");
    } catch (error) {
      console.error(error);
      Alert.alert("Failed to log out. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <Pressable
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 10,
        }}
        onPress={toggleDrawer}
      />

      {/* Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: DRAWER_WIDTH,
          height,
          transform: [{ translateX: drawerAnim }],
          backgroundColor: "#808080",
          borderTopRightRadius: 30,
          borderBottomRightRadius: 30,
          overflow: "hidden",
          zIndex: 20,
          paddingBottom: 150,
        }}
      >
        {/* Logo */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 20,
            marginTop: 60,
            marginBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.2)",
          }}
        >
          <DrawerLogo width={120} height={120} />
        </View>

        {/* Menu Items */}
        <View className="flex-1 mt-2.5">
          {menuItems.map((item, idx) => {
            const selected = pathname === item.route; 
            return (
              <View key={idx}>
                <Pressable
                  onPress={() => navigateTo(item.route)}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: selected ? "rgba(0,0,0,0.3)" : "transparent",
                  }}
                >
                  <Text className="text-white text-lg">{item.label}</Text>
                </Pressable>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    marginHorizontal: 20,
                    marginVertical: 20,
                  }}
                />
              </View>
            );
          })}
        </View>

        {/* Logout Button */}
        <View style={{ paddingHorizontal: 50, marginTop: 10 }}>
          <Pressable
            onPress={handleLogout}
            style={{
              backgroundColor: "#000",
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-white text-[20px] font-bold"> Logout </Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}
