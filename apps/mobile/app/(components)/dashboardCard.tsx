import { TouchableOpacity, View, Text } from "react-native";
import { EvilIcons } from "@expo/vector-icons";
import { ReactNode } from "react";

type DashboardCardProps = {
    description: string;
    icon?: ReactNode | null;
    variant?: "primary" | "secondary";
    legend?: string;
};

export default function DashboardCard({
    description,
    icon,
    variant = "primary",
    legend,
}: DashboardCardProps) {
    if (variant === "primary") {
        return (
            <TouchableOpacity className="py-8 px-4 w-44 h-44 bg-white rounded-[50px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] border-2 border-blue-900">
                <Text className="text-base text-black">
                    {description}
                </Text>

                <View className="relative mt-8">
                    <View className="h-0.5 w-full bg-black" />
                    {icon}
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity className="flex flex-row justify-between items-center py-8 px-8 w-full bg-white rounded-[35px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] border-2 border-blue-900">
            {icon ? icon : <EvilIcons name="clock" size={70} color="black" />}

            <View className="w-[60%]">
                <Text className="text-lg text-black">
                    {description}
                </Text>

                {legend && (
                    <Text className="mt-4 text-damascus-lightBlue font-semibold">
                        {legend}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}
