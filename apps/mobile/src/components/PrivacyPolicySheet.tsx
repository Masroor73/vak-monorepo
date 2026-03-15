import React, { useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MOCK_PRIVACY_POLICY_SECTIONS } from "@/constants/mockData";

type Props = {
    onClose: () => void;
};



export default function PrivacyPolicySheet({ onClose }: Props) {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["85%"], []);

    const handleClose = useCallback(() => {
        bottomSheetRef.current?.close();
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
                    <Text className="text-brand-primary text-lg font-bold">Privacy Policy</Text>
                </View>

                <Text className="text-gray-400 text-xs mb-5">Effective Date: January 1, 2026</Text>

                <Text className="text-white text-sm leading-5 mb-5">
                    This Privacy Policy describes how we collect, use, and protect your personal information when you use our
                    application. By using the app, you agree to the collection and use of information in accordance with this
                    policy.
                </Text>

                {MOCK_PRIVACY_POLICY_SECTIONS.map((section) => (
                    <View key={section.title} className="mb-4">
                        <Text className="text-brand-primary text-base font-bold mb-1">{section.title}</Text>
                        <Text className="text-white text-sm leading-5">{section.body}</Text>
                    </View>
                ))}
            </BottomSheetScrollView>
        </BottomSheet>
    );
}
