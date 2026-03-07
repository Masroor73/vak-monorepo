import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image, Pressable } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Location from "expo-location";

const LOCATION_OPTIONS = ["While using the app", "Only this time", "Don't Allow"] as const;

type LocationOption = (typeof LOCATION_OPTIONS)[number];

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function LocationBottomSheet({ open, onClose }: Props) {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["65%"], []);
    const [selectedOption, setSelectedOption] = useState<LocationOption>("While using the app");
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

    useEffect(() => {
        Location.getForegroundPermissionsAsync().then(({ status }) => {
            setPermissionStatus(status);
            if (status === Location.PermissionStatus.DENIED) {
                setSelectedOption("Don't Allow");
            }
        });
    }, [open]);

    const handleSelectOption = useCallback(
        async (option: LocationOption) => {
            setSelectedOption(option);

            if (option === "Don't Allow") {
                setPermissionStatus(Location.PermissionStatus.DENIED);
            } else {
                const { status } = await Location.requestForegroundPermissionsAsync();
                setPermissionStatus(status);

                if (status !== Location.PermissionStatus.GRANTED) {
                    setSelectedOption("Don't Allow");
                }
            }

            bottomSheetRef.current?.close();
        },
        [],
    );

    const statusText =
        permissionStatus === Location.PermissionStatus.GRANTED
            ? "You have currently enabled us to access your device's location."
            : "You have not enabled location access for this app.";

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
            <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, alignItems: "center" }}>
                <View className="flex-row items-center w-full mb-4">
                    <Pressable onPress={() => bottomSheetRef.current?.close()} className="mr-3">
                        <FontAwesome name="arrow-left" size={18} color="#62CCEF" />
                    </Pressable>
                    <Text className="text-lg font-bold text-center flex-1 mr-6 text-brand-primary">Location Access Settings</Text>
                </View>

                <Text className="text-base text-center text-gray-200 mb-4 px-2">{statusText}</Text>

                <View className="rounded-2xl overflow-hidden mb-6 w-full">
                    <Image source={require("@/assets/Map.png")} className="w-full h-48" resizeMode="cover" />
                </View>

                <View className="w-full gap-3">
                    {LOCATION_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option}
                            onPress={() => handleSelectOption(option)}
                            className={`py-3 rounded-xl border items-center bg-brand-secondaryLight ${selectedOption === option ? "border-brand-primary" : "border-gray-500"
                                }`}
                        >
                            <Text
                                className={`text-base font-medium ${selectedOption === option ? "text-brand-primary" : "text-gray-200"}`}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
}
