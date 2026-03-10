import { View, Text } from 'react-native'
import React from 'react'
import Input from './Input'

const fields = [
    {
        label: "First Name",
        placeholder: "Your First Name"
    },
    {
        label: "Last Name",
        placeholder: "Your Last Name"
    },
    {
        label: "Phone Number",
        placeholder: "(xxx) xxx-xxxx"
    },
    {
        label: "Email",
        placeholder: "user@example.com"
    },
]

const EditForm = () => {
    return (
        <View>
            <Text className='font-medium my-8 ml-8 text-lg text-gray-300'>Your Information</Text>
            <View className='mb-4 flex gap-4 ' >
                {fields.map((item, index) => (
                    <Input key={index} label={item.label} placeholder={item.placeholder} />
                ))}
            </View>
        </View>
    )
}

export default EditForm