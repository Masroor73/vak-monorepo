import { View, Pressable, Animated, Text, Dimensions, StyleSheet } from "react-native";
import DrawerLogo from "../../assets/DrawerLogo.svg";
import { useRouter, usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");
const DRAWER_WIDTH = 260;

type Props = {
  isOpen: boolean;
  toggleDrawer: () => void;
  pendingTasksCount?: number;   // shows red badge if > 0
  newRecognitionCount?: number; // shows "New" badge if > 0
};

const SECTIONS = (pendingTasksCount: number, newRecognitionCount: number) => [
  {
    label: "MAIN",
    items: [
      { label: "Daily Tasks List", subtitle: "View today's tasks", route: "/(tabs)/dailyTasks", icon: <Ionicons name="clipboard-outline" size={18} color="brown" />, badge: pendingTasksCount > 0 ? String(pendingTasksCount) : null, badgeRed: true,} ,
      { label: "Recognition", subtitle: "View & give kudos", route: "/(tabs)/recognition", icon: <Ionicons name="star" size={18} color="yellow" />, badge: newRecognitionCount > 0 ? "New" : null, badgeRed: false, },
    ],
  },
  {
    label: "SCHEDULING",
    items: [
      { label: "Set Availability", subtitle: "Update your schedule", route: "/(tabs)/setAvailability", icon: <Ionicons name="calendar-outline" size={18} color="red" />, badge: null, badgeRed: false },
    ],
  },
];

export default function Drawer({ isOpen, toggleDrawer, pendingTasksCount = 0, newRecognitionCount = 0 }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();

  const drawerAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: isOpen ? 0 : -DRAWER_WIDTH, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: isOpen ? 1 : 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [isOpen]);

  const handleLogout = async () => {
  try {
    await signOut();
  } catch (error) {
    console.log("SignOut error:", error);
  } finally {
    router.replace("/(public)/login"); // navigate no matter what
  }
};

  if (!isOpen) return null;

  return (
  <>
    {/* Overlay */}
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: "rgba(0,0,0,0.45)", zIndex: 10, opacity: overlayAnim },
      ]}
      pointerEvents="auto"
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={toggleDrawer} />
    </Animated.View>

    {/* Drawer */}
    <Animated.View style={[s.drawer, { transform: [{ translateX: drawerAnim }] }]}>
      
      {/* Logo */}
      <View className="items-center pt-16 pb-5">
        <DrawerLogo width={120} height={120} />
        <Text className="text-white text-xl font-bold tracking-widest mt-2">V.A.K</Text>
      </View>

      {/* Navigation Items */}
      <View className="px-3.5">
        
      <View className="h-1 bg-white/10 mx-5 mb-2" />
        {SECTIONS(pendingTasksCount, newRecognitionCount).map(({ label, items }) => (
          <View key={label}>
            <Text className="text-white/30 text-xs font-bold tracking-widest ml-3 mt-3 mb-2">{label}</Text>

            {items.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => {
                  router.push(item.route as any);
                  toggleDrawer();
                }}
                style={s.row}
              >
                {/* Icon */}
                <View style={s.iconBox}>
                  {item.icon}
                </View>

                {/* Labels */}
                <View className="flex-1 justify-center">
                  <Text className="text-[13px] font-medium text-white">{item.label}</Text>
                  <Text className="text-white/70 text-[11px]">{item.subtitle}</Text>
                </View>

                {/* Badge */}
                {item.badge && (
                  <View style={item.badgeRed ? s.badgeRed : s.badgeBlue}>
                    <Text style={item.badgeRed ? s.badgeTxtWhite : s.badgeTxtBlue}>{item.badge}</Text>
                  </View>
                )}
              </Pressable>
            ))}

            <View className="h-1 bg-white/10 mx-5 mb-2 mt-2" />
          </View>
        ))}
      </View>

      <View className="flex-1" />
      {/* Footer */}
      <View className="px-8">
        <Pressable onPress={handleLogout} style={s.logoutBtn}>
          <View style={s.logoutIconBox}>
            <MaterialIcons name="logout" size={18} color="#e74c3c" />
          </View>
          <Text className="text-red-400 text-sm font-semibold">Log Out</Text>
        </Pressable>
        <Text className="text-white/15 text-[10px] text-center tracking-wider py-3 pt-10">v1.0.0 · V.A.K App</Text>
      </View>

    </Animated.View>
  </>
);
}

const s = StyleSheet.create({
  drawer: {
    position: "absolute", top: 0, left: 0,
    width: DRAWER_WIDTH, height,
    backgroundColor: "#0d1b3e",
    borderTopRightRadius: 30, borderBottomRightRadius: 30,
    zIndex: 20, paddingBottom: 32,
    shadowColor: "#000", shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  row: { flexDirection: "row", alignItems: "center", height: 52, paddingHorizontal: 8, borderRadius: 12, marginBottom: 2 },
  iconBox: { width: 36, height: 36, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center", marginRight: 10 },
  badgeRed: { backgroundColor: "#e74c3c", borderRadius: 20, minWidth: 22, height: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeBlue: { backgroundColor: "rgba(91,143,240,0.2)", borderRadius: 20, minWidth: 36, height: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  badgeTxtWhite: { color: "#fff", fontSize: 11, fontWeight: "700" },
  badgeTxtBlue: { color: "#5b8ff0", fontSize: 11, fontWeight: "700" },
  logoutBtn: { flexDirection: "row", alignItems: "center", height: 60, paddingHorizontal: 14, borderRadius: 14, borderWidth: 3, borderColor: "rgba(235,76,60,0.3)", backgroundColor: "rgba(231,76,60,0.08)", marginBottom: 10 },
  logoutIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(231,76,60,0.15)", alignItems: "center", justifyContent: "center", marginRight: 12 },
});