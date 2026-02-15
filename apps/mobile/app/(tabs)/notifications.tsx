//apps/mobile/app/(tabs)/notifications.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaContext, SafeAreaFrameContext, SafeAreaView } from 'react-native-safe-area-context';

const Notifications = () => {
  return (
    <SafeAreaView className="flex-1 bg-damascus-background px-4 py-6">
      <Text className="text-blue-900 font-bold text-xl text-center ">Notification</Text>
    </SafeAreaView>
  );
};

export default Notifications;
