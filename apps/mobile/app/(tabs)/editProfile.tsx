import { View, Text, ScrollView, Alert } from 'react-native'
import React from 'react'
import Header from '@/src/components/Header'
import Avatar from '@/src/components/Avatar'
import EditForm from '@/src/components/EditForm'
import { PrimaryButton } from '@vak/ui'
import { FormProvider, useForm } from 'react-hook-form'
import { ProfileUpdateInput, ProfileUpdateSchema } from '@vak/contract'
import { zodResolver } from '@hookform/resolvers/zod'

const EditProfile = () => {
    const methods = useForm<ProfileUpdateInput>({
        resolver: zodResolver(ProfileUpdateSchema),
        defaultValues: {
            first_name: "",
            email: "",
            last_name: "",
            phone_number: "",
        }
    })
    function onSubmit(data: ProfileUpdateInput) {
        Alert.alert("Profile Updated:", `Saved: ${data.first_name} ${data.email}`)
    }
    return (
        <FormProvider {...methods}>
            <ScrollView className='flex-1 bg-white'>
                <Header title='Edit Profile' />
                <View className='flex items-center mt-8'>
                    <Avatar />
                </View>
                <EditForm />
                <View className='items-center'>
                    <PrimaryButton className="bg-brand-secondary" title='Save Changes' onPress={methods.handleSubmit(onSubmit)} />
                </View>
            </ScrollView>
        </FormProvider>
    )
}

export default EditProfile