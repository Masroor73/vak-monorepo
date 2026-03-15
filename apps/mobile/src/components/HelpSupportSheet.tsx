import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_HELP_SUPPORT_SECTIONS } from "@/constants/mockData";

type Props = {
    onClose: () => void;
};

export default function HelpSupportSheet({ onClose }: Props) {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["85%"], []);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const handleClose = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const toggleItem = useCallback((key: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={onClose}
            backgroundStyle={{ backgroundColor: "#1a3278" }}
            handleIndicatorStyle={{ backgroundColor: "#62CCEF" }}
            backdropComponent={(props) => (
                <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.6} />
            )}
        >
            <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <View className="flex-row items-center mb-2">
                    <Pressable onPress={handleClose} className="mr-3">
                        <FontAwesome name="arrow-circle-left" size={20} color="#62CCEF" />
                    </Pressable>
                    <Text className="text-brand-primary text-lg font-bold">Help & Support</Text>
                </View>

                <Text className="text-gray-400 text-xs mb-5">Frequently Asked Questions</Text>

                <Text className="text-white text-sm leading-5 mb-5">
                    Find answers to common questions below. If you can't find what you're looking for, please contact your manager
                    or reach out to our support team.
                </Text>

                {MOCK_HELP_SUPPORT_SECTIONS.map((section) => (
                    <View key={section.title} className="mb-5">
                        <Text className="text-brand-primary text-base font-bold mb-3">{section.title}</Text>

                        {section.items.map((item) => {
                            const key = `${section.title}-${item.question}`;
                            const isExpanded = expandedItems.has(key);

                            return (
                                <Pressable
                                    key={key}
                                    onPress={() => toggleItem(key)}
                                    className="mb-2 rounded-lg overflow-hidden"
                                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                                >
                                    <View className="flex-row items-center justify-between px-4 py-3">
                                        <Text className="text-white text-sm flex-1 mr-2">{item.question}</Text>
                                        <Ionicons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={16}
                                            color="#62CCEF"
                                        />
                                    </View>

                                    {isExpanded && (
                                        <View className="px-4 pb-3">
                                            <Text className="text-gray-300 text-sm leading-5">{item.answer}</Text>
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </BottomSheetScrollView>
        </BottomSheet>
    );
}
