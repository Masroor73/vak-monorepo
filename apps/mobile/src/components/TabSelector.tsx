import React, { useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";

export type Tab = "All" | "Unread" | "Most Recent"
type TabSelectorProps = {
    active: Tab;
    setActive: React.Dispatch<React.SetStateAction<Tab>>
}

const TABS: Tab[] = ["All", "Unread", "Most Recent"]
export default function TabSelector({ active, setActive }: TabSelectorProps) {
    return (
        <View className="flex-row mx-4 bg-gray-100 rounded-full p-1 mb-4">
            {TABS.map((tab, index) => {
                return (<TouchableOpacity className={`flex-1 items-center py-3 rounded-full ${active === tab ? "bg-black" : ""}`}
                    key={index}
                    onPress={() => setActive(tab)}
                >
                    <Text className={`text-xs font-medium ${active === tab ? "text-white font-semibold" : ""}`}>{tab}</Text>
                </TouchableOpacity>)
            })}
        </View>
    )
}