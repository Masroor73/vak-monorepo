//apps/mobile/app/(tabs)/profile.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Header from '@/src/components/Header';
import UserInfo from '@/src/components/UserInfo';
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HelpSupportSheet from '@/src/components/HelpSupportSheet';


type Tab = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void
}


function Tab({ icon, label, onPress }: Tab) {

  return (<TouchableOpacity className='flex-row items-center py-5 border-b border-gray-400' onPress={onPress}>
    <Ionicons color={'#9ca3af'} name={icon} size={24} />
    <Text className='ml-4 text-gray-400'>{label}</Text>
  </TouchableOpacity>)
}

const Profile = () => {
  const [showHelpSupport, setShowHelpSupport] = useState<boolean>(false);

  const tabs: Tab[] = [
    {
      icon: "globe-outline",
      label: "Location",
      onPress: () => { }
    },
    {
      icon: 'shield-outline',
      label: 'Privacy policy',
      onPress: () => { },
    },
    {
      icon: 'settings-outline',
      label: 'Notification preferences',
      onPress: () => { },
    },
    {
      icon: 'help-circle-outline',
      label: 'Help and support',
      onPress: () => setShowHelpSupport(true),
    },

  ]
  return (
    <SafeAreaView className="flex-1 bg-brand-secondary">
      <GestureHandlerRootView className="flex-1">
        <ScrollView>
          <Header title="My Profile" />
          <UserInfo />
          <View className="px-8 mt-2">
            {tabs.map((item, index) => (
              <Tab key={index} icon={item.icon} label={item.label} onPress={item.onPress} />
            ))}
          </View>
        </ScrollView>
        {showHelpSupport && <HelpSupportSheet onClose={() => setShowHelpSupport(false)} />}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default Profile;