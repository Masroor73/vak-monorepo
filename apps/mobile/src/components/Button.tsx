import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'

type ButtonProps = {
    action: () => void;
    text: string
}

const Button = ({ text, action }: ButtonProps) => {
    return (
        <TouchableOpacity className='px-10 bg-brand-secondary py-3 rounded-md' onPress={action}>
            <Text className='text-white font-semibold'>{text}</Text>
        </TouchableOpacity>
    )
}

export default Button