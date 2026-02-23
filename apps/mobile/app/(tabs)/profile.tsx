//apps/mobile/app/(tabs)/profile.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Header from '@/src/components/Header';
import UserInfo from '@/src/components/UserInfo';
import { Ionicons } from "@expo/vector-icons"


type Tab = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void
}

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
    onPress: () => { },
  },

]

const Profile = () => {

  function Tab({ icon, label, onPress }: Tab) {

    return (<TouchableOpacity className='flex-row items-center py-5 border-b border-gray-600' onPress={onPress}>
      <Ionicons name={icon} size={24} />
      <Text className='ml-4'>{label}</Text>
    </TouchableOpacity>)
  }

  return (
    <ScrollView className='flex-1 bg-white'>
      <Header title='My Profile' />
      <UserInfo />
      <View className='px-8 mt-2'>
        {tabs.map((item, index) => (
          <Tab key={index} icon={item.icon} label={item.label} onPress={item.onPress} />
        ))}
      </View>
    </ScrollView>
  );
};

export default Profile;