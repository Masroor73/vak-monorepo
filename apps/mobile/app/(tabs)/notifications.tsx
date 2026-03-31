import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Pressable} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import TabSelector, { Tab } from '@/src/components/TabSelector'
import WhiteArrow from '../../assets/WhiteArrow.svg'

export type Notification = {
  id: string
  type: 'SHIFT_PUBLISHED' | 'SWAP_REQUEST' | 'SWAP_APPROVED' | 'GENERAL'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const TYPE_CONFIG = {
  SHIFT_PUBLISHED: { icon: 'calendar',     color: '#0d1b3e', bg: '#c7d0f0' },
  SWAP_REQUEST:    { icon: 'repeat',        color: '#92400E', bg: '#FDE68A' },
  SWAP_APPROVED:   { icon: 'check-circle',  color: '#065F46', bg: '#A7F3D0' },
  GENERAL:         { icon: 'bell',          color: '#1F2937', bg: '#E5E7EB' },
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

export default function NotificationsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Tab>('All')

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      loadNotifications()
    }, [user])
  )

  async function loadNotifications() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, is_read, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }
    setNotifications(data as Notification[])
    setLoading(false)
  }

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    )
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user!.id)
      .eq('is_read', false)
  }

  const filtered = notifications.filter((n) => {
    if (active === 'Unread') return !n.is_read
    return true
  }).sort((a, b) => {
    if (active === 'Most Recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return 0
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d1b3e" />
      <SafeAreaView className="flex-1 bg-brand-background" edges={['bottom']}>

        {/* Tab selector + Mark all read row */}
        <View className="px-4 pt-4 pb-2">
          <TabSelector active={active} setActive={setActive} />

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              activeOpacity={0.7}
              className="flex-row items-center gap-2 mt-3 self-end"
            >
              <Feather name="check-square" size={15} color="#0d1b3e" />
              <Text className="text-[13px] font-semibold text-brand-secondary">
                Mark all as read ({unreadCount})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#0d1b3e" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View className="h-2.5" />}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center pt-24">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
                  <Feather name="bell-off" size={28} color="#9e9e9e" />
                </View>
                <Text className="text-[15px] font-medium text-gray-400">
                  {active === 'Unread' ? 'No unread notifications' : 'No notifications yet'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onPress={() => markAsRead(item.id)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </>
  )
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: Notification
  onPress: () => void
}) {
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.GENERAL

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`bg-white rounded-2xl p-4 flex-row gap-3 ${!notification.is_read ? 'border-l-4 border-l-brand-primary' : ''}`}
    >
      {/* Icon */}
      <View
        className="w-11 h-11 rounded-xl items-center justify-center mt-0.5 flex-shrink-0"
        style={{ backgroundColor: config.bg }}
      >
        <Feather name={config.icon as any} size={20} color={config.color} />
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2 mb-1">
          <Text className="text-[15px] font-bold text-gray-900 flex-1">
            {notification.title}
          </Text>
          <Text className="text-[12px] text-gray-500 flex-shrink-0 font-medium">
            {formatTime(notification.created_at)}
          </Text>
        </View>
        <Text className="text-[14px] text-gray-700 leading-5 font-medium">
          {notification.message}
        </Text>

        {/* Unread dot */}
        {!notification.is_read && (
          <View className="flex-row items-center gap-1 mt-2">
            <View className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            <Text className="text-[12px] text-brand-primary font-semibold">Unread</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}