import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import Header from '@/src/components/Header'
import Avatar from '@/src/components/Avatar'
import EditForm from '@/src/components/EditForm'
import { PrimaryButton } from '@vak/ui'

const EditProfile = () => {
    return (
        <ScrollView className='flex-1 bg-brand-secondary'>
            <Header title='Edit Profile' />
            <View className='flex items-center mt-8'>
                <Avatar />
            </View>
            <EditForm />
            <View className='items-center'>
                <PrimaryButton className="bg-brand-secondaryLight" title='Save Changes' />
            </View>
        </ScrollView>
    )
}

export default EditProfile