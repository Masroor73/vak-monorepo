import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import Avatar from './Avatar'
import { useRouter } from 'expo-router'
import { PrimaryButton } from '@vak/ui'
import { useAuth } from '@/context/AuthContext'

type Props = {
  onAvatarPress?: () => void
}

const UserInfo = ({ onAvatarPress }: Props) => {

    const router = useRouter()
    const { user } = useAuth()

    const fullName =
      user?.user_metadata?.full_name ||
      user?.email ||
      "User"

    return (
        <View className='flex-row items-center gap-8 pt-8 pb-6 px-6'>
            
            <TouchableOpacity onPress={onAvatarPress}>
                <Avatar />
            </TouchableOpacity>

            <View>
                <Text className='text-xl font-bold'>
                    {fullName}
                </Text>

                <Text className='mt-1 mb-4'>
                    {user?.email}
                </Text>

                <PrimaryButton
                    className="bg-brand-secondary"
                    title={"Edit Profile"}
                    onPress={() => router.push("/(tabs)/editProfile")}
                />
            </View>

        </View>
    )
}

export default UserInfo