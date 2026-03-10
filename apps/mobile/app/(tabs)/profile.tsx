//apps/mobile/app/(tabs)/profile.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Header from '@/src/components/Header';
import UserInfo from '@/src/components/UserInfo';
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PrivacyPolicySheet from '@/src/components/PrivacyPolicySheet';


type Tab = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void
}


function Tab({ icon, label, onPress }: Tab) {

  return (<TouchableOpacity className='flex-row items-center py-5 border-b border-gray-600' onPress={onPress}>
    <Ionicons name={icon} size={24} />
    <Text className='ml-4'>{label}</Text>
  </TouchableOpacity>)
}

const Profile = () => {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);

  const tabs: Tab[] = [
    {
      icon: "globe-outline",
      label: "Location",
      onPress: () => { }
    },
    {
      icon: 'shield-outline',
      label: 'Privacy policy',
      onPress: () => setShowPrivacyPolicy(true),
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
  return (

    <SafeAreaView className='flex-1 bg-white'>
      <GestureHandlerRootView className='flex-1'>
        <ScrollView >
          <Header title='My Profile' />
          <UserInfo />
          <View className='px-8 mt-2'>
            {tabs.map((item, index) => (
              <Tab key={index} icon={item.icon} label={item.label} onPress={item.onPress} />
            ))}
          </View>
        </ScrollView>
        {showPrivacyPolicy && <PrivacyPolicySheet onClose={() => setShowPrivacyPolicy(false)} />}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default Profile;