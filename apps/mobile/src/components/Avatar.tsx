import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from "@expo/vector-icons"


const Avatar = () => {
    return (
        <View className='w-36 h-36 rounded-full border flex items-center justify-center relative'>
            <Text className='text-gray-500 text-4xl font-semibold'>KO</Text>
            <TouchableOpacity className='absolute right-0 bottom-0 border rounded-full p-1 bg-white'>
                <Ionicons name='camera-outline' size={20} />
            </TouchableOpacity>
        </View>
    )
}

export default Avatar