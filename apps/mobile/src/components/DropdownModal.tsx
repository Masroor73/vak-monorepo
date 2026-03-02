import { View, Text, Modal, Pressable } from "react-native";
import React from "react";
import { DropdownOption } from "./DropdownPill";

type DropdownModalProps = {
    open: boolean;
    options: DropdownOption[];
    pillLayout: { x: number; y: number; width: number; height: number };
    value: string;
    onSelect: (value: string) => void;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DropdownModal = ({ open, options, pillLayout, value, onSelect, setOpen }: DropdownModalProps) => {
    return (
        <Modal visible={open} transparent animationType="none">
            <Pressable className="flex-1 items-center bg-black/70" onPress={() => setOpen(false)}>
                <View
                    className="rounded-2xl bg-brand-secondary shadow-lg border border-gray-200"
                    style={{
                        marginTop: pillLayout.y + pillLayout.height + 8,
                        width: "93%",
                        elevation: 8,
                    }}
                >
                    {options.map((option, index) => (
                        <Pressable
                            key={option.value}
                            onPress={() => {
                                onSelect(option.value);
                                setOpen(false);
                            }}
                            className={`flex-row items-center px-5 py-4 ${index < options.length - 1 ? "border-b border-gray-200" : ""
                                }`}
                        >
                            {option.color && (
                                <View className="mr-3 h-3.5 w-3.5 rounded-full" style={{ backgroundColor: option.color }} />
                            )}
                            <Text
                                className={`text-base ${option.value === value ? "font-bold text-brand-primary" : "text-gray-200"}`}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </Pressable>
        </Modal>
    );
};

export default DropdownModal;
