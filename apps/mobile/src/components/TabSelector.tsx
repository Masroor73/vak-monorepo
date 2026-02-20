import React from "react";
import { TouchableOpacity, View, Text } from "react-native";

export type Tab = "All" | "Unread" | "Most Recent";

type TabSelectorProps = {
    active: Tab;
    setActive: React.Dispatch<React.SetStateAction<Tab>>;
};

const TABS: Tab[] = ["All", "Unread", "Most Recent"];

export default function TabSelector({ active, setActive }: TabSelectorProps) {
    return (
        <View className="flex-row h-12 bg-gray-200 rounded-full p-1 mb-4 border border-black overflow-hidden">
            {TABS.map((tab) => {
                const isActive = active === tab;

                return (
                    <TouchableOpacity
                        key={tab}
                        className={`flex-1 h-full items-center justify-center rounded-full ${isActive ? "bg-black" : "bg-transparent"
                            }`}
                        onPress={() => setActive(tab)}
                        activeOpacity={0.8}
                    >
                        <Text className={`text-base ${isActive ? "text-white" : "text-black"}`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}