import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from 'expo-router'

type HeaderProps = {
    title: string
}

const Header = ({ title }: HeaderProps) => {
    const router = useRouter()
    return (
        <View className="flex-row items-center px-4 pt-4 pb-3">
            <TouchableOpacity onPress={() => router.canGoBack()}>
                <Ionicons name="arrow-back" size={24} color={"#063386"} />
            </TouchableOpacity>
            <View className='flex-1 items-center '>
                <Text className='text-brand-secondary font-bold text-lg'>{title}</Text>
            </View>
        </View>
    )
}

export default Header