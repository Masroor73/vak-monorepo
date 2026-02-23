import { View, Text } from 'react-native'
import React from 'react'
import Avatar from './Avatar'
import Button from './Button'

const UserInfo = () => {
    return (
        <View className='flex-row items-center gap-8 pt-8 pb-6 px-6'>
            <Avatar />
            <View>
                <Text className='text-xl font-bold'>Nome</Text>
                <Text className='mt-1 mb-4'>Email</Text>
                <Button text={"Edit Profile"} action={() => { }} />
            </View>
        </View>
    )
}

export default UserInfo