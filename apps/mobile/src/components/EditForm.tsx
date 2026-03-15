import { View, Text } from 'react-native'
import React from 'react'
import Input from './Input'
import { PROFILE_FIELDS } from '@/constants/mockData'
import { useFormContext, Controller } from 'react-hook-form'
import { ProfileUpdateInput } from '@vak/contract'

const EditForm = () => {
    const { control, formState: { errors } } = useFormContext<ProfileUpdateInput>()
    return (
        <View>
            <Text className='font-medium my-8 ml-8 text-lg text-gray-300'>Your Information</Text>
            <View className='mb-4 flex gap-4 ' >
                {PROFILE_FIELDS.map((item, index) => (
                    <Controller
                        key={index}
                        control={control}
                        name={item.name}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                label={item.label}
                                placeholder={item.placeholder}
                                value={value}
                                onChange={onChange}
                                onBlur={onBlur}
                                errorText={errors[item.name]?.message}
                            />
                        )}
                    />
                ))}
            </View>
        </View>
    )
}

export default EditForm