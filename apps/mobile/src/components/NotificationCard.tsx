import { View, Text } from "react-native"
import { NotificationType } from "@/app/(tabs)/notifications"

type NotificationCardProps = Omit<NotificationType, "id" | "timestamp">

export default function NotificationCard({ message, time, unread }: NotificationCardProps) {
    return (
        <View className={`w-full mb-3 h-auto p-4 bg-neutral-50 rounded-xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] border border-black ${unread ? 'border-l-4 border-l-blue-500' : ''}`}>
            <Text>{message}</Text>
            <Text className="text-right">{time}</Text>
        </View>
    )
}