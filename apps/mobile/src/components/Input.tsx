import { View, Text } from 'react-native'
import React from 'react'
import { TextField } from '@vak/ui'

type InputProps = {
    label: string
    placeholder: string
    value?: string
    onChange?: (text: string) => void
    onBlur?: () => void
    errorText?: string
}

const Input = ({ label, placeholder, value, onChange, onBlur, errorText }: InputProps) => {
    return (
        <View className='relative'>
            <Text className='absolute left-16 -top-3 bg-white z-50'>{label}</Text>
            <TextField
                className=''
                placeholder={placeholder}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorText={errorText}
                maxLength={50}
            />
        </View>
    )
}

export default Input