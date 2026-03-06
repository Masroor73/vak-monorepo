import { View, Text } from 'react-native'
import React from 'react'
import Avatar from './Avatar'
import { useRouter } from 'expo-router'
import { PrimaryButton } from '@vak/ui'

const UserInfo = () => {

    const router = useRouter()

    return (
        <View className='flex-row items-center gap-8 pt-8 pb-6 px-6'>
            <Avatar />
            <View>
                <Text className='text-xl font-bold'>Nome</Text>
                <Text className='mt-1 mb-4'>Email</Text>
                <PrimaryButton className="bg-brand-secondary" title={"Edit Profile"} onPress={() => router.push("/(tabs)/editProfile")} />
            </View>
        </View>
    )
}

export default UserInfo