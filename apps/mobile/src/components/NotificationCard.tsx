import { View, Text, TouchableOpacity } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { Notification } from '@/app/(tabs)/notifications'

const TYPE_CONFIG = {
  SHIFT_PUBLISHED: { icon: 'calendar',     color: '#0d1b3e', bg: '#eef2ff' },
  SWAP_REQUEST:    { icon: 'repeat',        color: '#D97706', bg: '#FEF3C7' },
  SWAP_APPROVED:   { icon: 'check-circle',  color: '#059669', bg: '#D1FAE5' },
  GENERAL:         { icon: 'bell',          color: '#6B7280', bg: '#F3F4F6' },
} as const

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Props = {
  notification: Notification
  onPress: () => void
}

export default function NotificationCard({ notification, onPress }: Props) {
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.GENERAL

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`bg-white rounded-2xl p-4 flex-row gap-3 ${!notification.is_read ? 'border-l-4 border-l-brand-primary' : ''}`}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mt-0.5 flex-shrink-0"
        style={{ backgroundColor: config.bg }}
      >
        <Feather name={config.icon as any} size={18} color={config.color} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2 mb-1">
          <Text className="text-[13px] font-semibold text-brand-secondary flex-1">
            {notification.title}
          </Text>
          <Text className="text-[11px] text-gray-400 flex-shrink-0">
            {formatTime(notification.created_at)}
          </Text>
        </View>
        <Text className="text-[13px] text-gray-500 leading-5">
          {notification.message}
        </Text>
        {!notification.is_read && (
          <View className="flex-row items-center gap-1 mt-2">
            <View className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            <Text className="text-[11px] text-brand-primary font-medium">Unread</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}