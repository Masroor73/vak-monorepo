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
            <Text className='absolute left-16 -top-3 bg-white z-50'>{label}</Text>
            <TextField className='' placeholder={placeholder} />
        </View>
    )
}

export default Input