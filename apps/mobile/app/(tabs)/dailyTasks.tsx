import React, { useState } from "react";
import { View, Text, FlatList, Modal, Pressable } from "react-native";
import { TaskCard } from "@vak/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import DropdownPill, {
  type DropdownOption,
} from "../../src/components/DropdownPill";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MOCK_TASKS, type Task } from "@/constants/mockData";

const SORT_OPTIONS: DropdownOption[] = [
  { label: "All tasks", value: "all" },
  { label: "High Priority", value: "high", color: "#EF4444" },
  { label: "Medium Priority", value: "medium", color: "#FBBF24" },
  { label: "Low Priority", value: "low", color: "#10B981" },
  { label: "Kitchen", value: "kitchen" },
  { label: "Service Area", value: "service" },
];

const FILTER_OPTIONS: DropdownOption[] = [
  { label: "All tasks", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
];

export default function DailyTasks() {
  const [sortBy, setSortBy] = useState("all");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sortedTasks = MOCK_TASKS.filter((task) => {
    if (sortBy === "all") return true;
    if (["high", "medium", "low"].includes(sortBy)) {
      return task.priority === sortBy;
    }
    return task.area === sortBy;
  });

  const visibleTasks = sortedTasks.filter((task) => {
    if (filterBy === "all") return true;
    return task.status === filterBy;
  });

  return (
    <SafeAreaView className="flex-1 bg-brand-secondary">
      <Text className="mt-4 text-center text-2xl font-bold text-brand-primary">Today's Checklist</Text>

      <View className="px-4">
        <View className="w-full  mt-4 flex-row items-center justify-around rounded-full border border-gray-200 px-4 py-2">
          <DropdownPill label="Sort By:" value={sortBy} options={SORT_OPTIONS} onSelect={setSortBy} />
          <DropdownPill label="Filter By:" value={filterBy} options={FILTER_OPTIONS} onSelect={setFilterBy} />
        </View>
      </View>

      <FlatList
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <TaskCard title={item.title} priority={item.priority} onPress={() => setSelectedTask(item)} />
        )}
        ListEmptyComponent={<Text className="mt-8 text-center text-gray-400">No tasks found.</Text>}
      />

      <Modal visible={selectedTask !== null} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-5"
          onPress={() => setSelectedTask(null)}
        >
          <View
            className="w-full rounded-3xl bg-brand-secondary px-6 pb-8 pt-5"
            style={{ elevation: 10 }}
            onStartShouldSetResponder={() => true}
          >
            <View className="mb-4 flex-row items-center gap-3">
              <Pressable onPress={() => setSelectedTask(null)}>
                <Ionicons name="arrow-back" size={22} color="#62CCEF" />
              </Pressable>
              <Text className="flex-1 text-lg font-bold text-brand-primary">{selectedTask?.title}</Text>
            </View>

            <Text className="mb-2 text-sm font-semibold text-gray-300">Task description</Text>

            <Text className="mb-6 text-base leading-6 text-gray-200">{selectedTask?.description}</Text>

            {selectedTask?.status === "pending" && (
              <View className="items-center">
                <Pressable onPress={() => setSelectedTask(null)} className="rounded-full bg-brand-success px-10 py-3">
                  <Text className="text-base font-bold text-white">Mark As Done</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
