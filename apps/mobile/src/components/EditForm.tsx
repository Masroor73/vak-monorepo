import { View, Text } from 'react-native'
import React from 'react'
import Input from './Input'
import { PROFILE_FIELDS } from '@/constants/mockData'

const EditForm = () => {
    return (
        <View>
            <Text className='font-medium my-8 ml-8 text-lg'>Your Information</Text>
            <View className='mb-4 flex gap-4 ' >
                {PROFILE_FIELDS.map((item, index) => (
                    <Input key={index} label={item.label} placeholder={item.placeholder} />
                ))}
            </View>
        </View>
    )
}

export default EditForm