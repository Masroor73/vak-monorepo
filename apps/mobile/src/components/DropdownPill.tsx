import React, { useRef, useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import DropdownModal from "./DropdownModal";

export interface DropdownOption {
    label: string;
    value: string;
    color?: string;
}

interface DropdownPillProps {
    label: string;
    value: string;
    options: DropdownOption[];
    onSelect: (value: string) => void;
}

export default function DropdownPill({ label, value, options, onSelect }: DropdownPillProps) {
    const [open, setOpen] = useState(false);
    const pillRef = useRef<View>(null);
    const [pillLayout, setPillLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

    const handleOpen = () => {
        pillRef.current?.measureInWindow((x, y, width, height) => {
            setPillLayout({ x, y, width, height });
            setOpen(true);
        });
    };

    return (
        <View className="flex-row items-center gap-2">
            <Text className="text-sm text-gray-200">{label}</Text>
            <Pressable
                ref={pillRef}
                onPress={handleOpen}
                className="flex-row items-center rounded-full border border-brand-primary px-3 py-1"
            >
                <Text className="text-sm text-brand-primary">{selectedLabel}</Text>
                <Text className="ml-1 text-xs text-brand-primary">▼</Text>
            </Pressable>

            <DropdownModal
                open={open}
                options={options}
                pillLayout={pillLayout}
                value={value}
                onSelect={onSelect}
                setOpen={setOpen}
            />
        </View>
    );
}
