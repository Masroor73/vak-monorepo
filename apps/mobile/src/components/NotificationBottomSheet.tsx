import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, Switch, Pressable } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const ALERT_TYPES = ["sound", "vibrate", "mute"] as const;
type AlertType = (typeof ALERT_TYPES)[number];

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function NotificationBottomSheet({ open, onClose }: Props) {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["55%"], []);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState<AlertType>("sound");

    const handleToggleNotifications = useCallback((value: boolean) => {
        setNotificationsEnabled(value);
    }, []);

    const handleSelectAlert = useCallback((type: AlertType) => {
        setSelectedAlert(type);
    }, []);

    if (!open) return null;

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={onClose}
            backgroundStyle={{ backgroundColor: "#0d1b3e" }}
            handleIndicatorStyle={{ backgroundColor: "#ccc" }}
            backdropComponent={(props) => (
                <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.6} />
            )}
        >
            <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <View className="flex-row items-center w-full mb-6">
                    <Pressable onPress={() => bottomSheetRef.current?.close()} className="mr-3">
                        <FontAwesome name="arrow-left" size={18} color="#62CCEF" />
                    </Pressable>
                    <Text className="text-lg font-bold text-center flex-1 mr-6 text-brand-primary">Notification</Text>
                </View>

                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-semibold text-white">Show Notifications</Text>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={handleToggleNotifications}
                        trackColor={{ false: "#555", true: "#34C759" }}
                        thumbColor="#fff"
                    />
                </View>

                <View className="h-px bg-gray-500 my-4" />

                <Text className="text-base font-semibold text-white mb-8">Alert Type</Text>

                <View className="flex-1 flex-row items-center justify-between ">
                    {ALERT_TYPES.map((type) => {
                        const isSelected = selectedAlert === type;
                        return (
                            <Pressable
                                key={type}
                                onPress={() => handleSelectAlert(type)}
                                className={`w-20 h-20 rounded-full items-center justify-center ${isSelected ? "border-2 border-green-500 bg-brand-secondaryLight" : "bg-brand-secondaryLight"
                                    }`}
                            >
                                {type === "vibrate" ? (
                                    <MaterialCommunityIcons name="vibrate" size={32} color={isSelected ? "#fff" : "#94a3b8"} />
                                ) : (
                                    <Ionicons name={type === "sound" ? "volume-high" : "volume-mute"} size={32} color={isSelected ? "#fff" : "#94a3b8"} />
                                )}
                            </Pressable>
                        );
                    })}
                </View>

                <View className="h-px bg-gray-500 mt-6" />
            </BottomSheetScrollView>
        </BottomSheet>
    );
}
