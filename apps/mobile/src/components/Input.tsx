import { View, Text } from 'react-native'
import React from 'react'
import { TextField } from '@vak/ui'

type InputProps = {
    label: string
    placeholder: string
}

const Input = ({ label, placeholder }: InputProps) => {
    return (
        <View className='relative'>
            <Text className='absolute left-16 -top-3 bg-brand-secondary z-50 text-gray-400'>{label}</Text>
            <TextField className='' placeholder={placeholder} variant='dark' />
        </View>
    )
}

export default Input