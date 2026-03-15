import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from "@expo/vector-icons"


const Avatar = () => {
    return (
        <View className='w-36 h-36 rounded-full border border-gray-400 flex items-center justify-center relative'>
            <Text className='text-gray-400 text-4xl font-semibold'>KO</Text>
            <TouchableOpacity className='absolute right-0 bottom-0 border border-gray-400 rounded-full p-1 bg-brand-secondary'>
                <Ionicons color='#9ca3af' name='camera-outline' size={20} />
            </TouchableOpacity>
        </View>
    )
}

export default Avatar