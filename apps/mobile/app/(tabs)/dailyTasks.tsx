import React, { useState } from "react";
import { View, Text, FlatList, Modal, Pressable } from "react-native";
import { TaskCard } from "@vak/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import DropdownPill, {
  type DropdownOption,
} from "../../src/components/DropdownPill";
import Ionicons from "@expo/vector-icons/Ionicons";

type Priority = "low" | "medium" | "high";

type Status = "pending" | "completed";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  area?: string;
  status: Status;
}

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Check fridge temperatures",
    description:
      "Inspect and record the current temperature of all fridges and freezers in the kitchen and storage area.\nEnsure all units are operating below 4°C (40°F) for food safety compliance.\nReport any equipment showing abnormal readings immediately to your manager before beginning prep work.",
    priority: "high",
    area: "kitchen",
    status: "pending",
  },
  {
    id: "2",
    title: "Prepare service counter",
    description:
      "Set up the service counter with all necessary utensils, napkins, and condiments.\nEnsure the counter is clean and sanitized before placing any items.\nCheck that all display items are properly labeled and arranged.",
    priority: "medium",
    area: "service",
    status: "pending",
  },
  {
    id: "3",
    title: "Wipe prep surfaces",
    description:
      "Clean and sanitize all preparation surfaces using approved cleaning solution.\nPay special attention to cutting boards and stainless steel areas.\nAllow surfaces to air dry before use.",
    priority: "high",
    area: "kitchen",
    status: "pending",
  },
  {
    id: "4",
    title: "Refill sauces and condiments",
    description:
      "Check all sauce bottles and condiment containers at each station.\nRefill any that are below half capacity using FIFO rotation.\nWipe down all containers after refilling.",
    priority: "medium",
    area: "service",
    status: "pending",
  },
  {
    id: "5",
    title: "Log food waste if applicable",
    description:
      "Record any food waste from the shift in the waste log sheet.\nInclude item name, quantity, and reason for disposal.\nNotify the manager if waste exceeds normal levels.",
    priority: "low",
    area: "kitchen",
    status: "completed",
  },
  {
    id: "6",
    title: "Turn off equipment",
    description:
      "Power down all kitchen equipment that is not needed for the next shift.\nCheck that ovens, grills, and fryers are properly turned off.\nEnsure all pilot lights are extinguished where applicable.",
    priority: "high",
    area: "kitchen",
    status: "pending",
  },
];

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
