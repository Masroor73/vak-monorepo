import { View, Text, FlatList } from "react-native";
import DashboardCard from "../(components)/dashboardCard";
import { EvilIcons } from "@expo/vector-icons";

const cards1 = [
  {
    description: "Tap here to log your time and stay on schedule.",
    icon: (
      <EvilIcons
        className="absolute right-3 -top-7 bg-white rounded-full p-1"
        name="clock"
        size={40}
        color="black"
      />
    ),
  },
  {
    description: "View and complete your daily tasks to stay on track.",
    icon: (
      <EvilIcons
        className="absolute right-3 -top-5 bg-white rounded-full p-1"
        name="check"
        size={28}
        color="black"
      />
    ),
  },
  {
    description: "Help us cut down food waste by reporting it.",
    icon: (
      <EvilIcons
        className="absolute right-3 -top-5 bg-white rounded-full p-1"
        name="trash"
        size={28}
        color="black"
      />
    ),
  },
];

const cards2 = [
  {
    description: "Stay on top of your schedule and never miss a shift.",
    legend: "View All →",
    icon: <EvilIcons name="calendar" size={64} color="black" />,
  },
  {
    description: "See your latest notes and recognition.",
    legend: "View Feedback →",
    icon: <EvilIcons name="comment" size={64} color="black" />,
  },
  {
    description: "Set the days and times you’re free.",
    legend: "Update →",
    icon: <EvilIcons name="clock" size={64} color="black" />,
  },
  {
    description: "Get quick answers and support from your assistant.",
    legend: "Chat →",
    icon: <EvilIcons name="comment" size={64} color="black" />,
  },
];

export default function Index() {
  return (
    <View className="flex-1 p-4 bg-damascus-background pb-28">
      <Text className="text-blue-900 font-bold text-2xl my-6">
        Welcome!
      </Text>

      {/* HORIZONTAL SCROLL (TOP 3 CARDS) */}
      <View className="mb-8">
        <FlatList
          data={cards1}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <DashboardCard
              icon={item.icon}
              description={item.description}
            />
          )}
          horizontal
          ItemSeparatorComponent={() => <View className="w-5" />}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* VERTICAL SCROLL (WITH ICONS BACK) */}
      <FlatList
        data={cards2}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <DashboardCard
            variant="secondary"
            icon={item.icon}
            legend={item.legend}
            description={item.description}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-5" />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
