import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import TabSelector, { Tab } from '@/src/components/TabSelector';
import NotificationCard from '@/src/components/NotificationCard';

export type NotificationType = {
  id: string;
  message: string;
  time: string;
  unread: boolean;
  timestamp: number;
};

const NOTIFICATIONS: NotificationType[] = [
  {
    id: '1',
    message:
      'You have been scheduled for 2 extra hours tomorrow due to high expected demand. Please confirm availability.',
    time: 'Now',
    unread: true,
    timestamp: 4,
  },
  {
    id: '2',
    message:
      'Your shift swap with Alex for Nov 3 has been approved. New schedule: 1 PM – 9 PM.',
    time: 'Yesterday',
    unread: true,
    timestamp: 2,
  },
  {
    id: '3',
    message:
      'Significant lettuce waste recorded yesterday. Review prep portions to reduce future waste.',
    time: 'Now',
    unread: false,
    timestamp: 3,
  },
  {
    id: '4',
    message:
      'Oven #3 will be repaired at 3 PM today. Please plan prep accordingly.',
    time: 'October, 30',
    unread: false,
    timestamp: 1,
  },
];

function getVisibleNotifications(tab: Tab) {
  if (tab === 'Unread')
    return NOTIFICATIONS.filter((item) => item.unread);

  if (tab === 'Most Recent')
    return [...NOTIFICATIONS].sort((a, b) => b.timestamp - a.timestamp);

  return NOTIFICATIONS;
}

const Notifications = () => {
  const [active, setActive] = useState<Tab>('All');
  const notifications = getVisibleNotifications(active);

  return (
    <View className="flex-1 bg-damascus-background p-4">
      <Text className="text-blue-900 font-bold text-2xl text-center mb-4">
        Notifications
      </Text>

      <TabSelector active={active} setActive={setActive} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text>No Notifications!</Text>}
        renderItem={({ item }) => (
          <NotificationCard
            message={item.message}
            time={item.time}
            unread={item.unread}
          />
        )}
      />
    </View>
  );
};

export default Notifications;