import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, StatusBar, Image, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Profile } from '@vak/contract'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const insets = useSafeAreaInsets()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      loadProfile()
    }, [user])
  )

  async function loadProfile() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, avatar_url, role, is_approved, hourly_rate')
      .eq('id', user!.id)
      .single()
    if (error) { console.error(error); setLoading(false); return }
    setProfile(data as Profile)
    setLoading(false)
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const closeDeleteModal = () => {
    setDeleteModalVisible(false)
    setPassword('')
    setDeleteError(null)
  }

  const handleDeleteConfirm = async () => {
    setDeleteError(null)

    if (!password.trim()) {
      setDeleteError('Please enter your password.')
      return
    }

    setDeleting(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile!.email,
        password: password.trim(),
      })
      if (signInError) {
        setDeleteError('Incorrect password. Please try again.')
        return
      }
      const { error } = await supabase.rpc('delete_user_account')
      if (error) throw error
      await signOut()
      router.replace('/(public)/login')
    } catch (err: any) {
      setDeleteError(err.message ?? 'Could not delete account. Please try again.')
    } finally {
      setDeleting(false)
      setPassword('')
    }
  }

  console.log('insets', insets)

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator color="#0d1b3e" />
      </View>
    )
  }

  const cardShadow = {
    shadowColor: '#0d1b3e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d1b3e" />
      <View style={{ flex: 1 }} className="bg-brand-background">
        <ScrollView
          className="flex-1 bg-brand-background"
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Avatar card */}
          <View className="mx-4 mt-8 bg-white rounded-2xl p-5 flex-row items-center gap-4" style={cardShadow}>
            <View className="w-16 h-16 rounded-full bg-brand-secondary items-center justify-center">
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-16 h-16 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-white text-[22px] font-medium">{initials}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[18px] font-bold text-gray-900">
                {profile?.full_name ?? '—'}
              </Text>
              <Text className="text-[14px] text-gray-600 mt-0.5">
                {profile?.email}
              </Text>
              <View className="mt-1.5 self-start bg-[#eef2ff] rounded-md px-2 py-0.5">
                <Text className="text-[12px] text-brand-secondary font-semibold">
                  {profile?.role ?? 'EMPLOYEE'}
                </Text>
              </View>
            </View>
          </View>

          {/* Details card */}
          <View className="mx-4 mt-8 bg-white rounded-2xl overflow-hidden mb-8" style={cardShadow}>
            <Text className="text-[15px] font-semibold text-gray-800 tracking-wide px-4 pt-3.5 pb-1.5">
              ACCOUNT DETAILS
            </Text>
            <InfoRow icon="user" label="Full name" value={profile?.full_name ?? '—'} />
            <InfoRow icon="mail" label="Email" value={profile?.email ?? '—'} />
            <InfoRow icon="phone" label="Phone" value={profile?.phone_number ?? '—'} last />
          </View>

          {/* Edit button */}
          <View className="mx-4 mb-2.5">
            <TouchableOpacity
              className="bg-brand-secondary rounded-xl h-16 items-center justify-center"
              onPress={() => router.push('/(tabs)/editProfile')}
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold text-[15px]">Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Added by Carivaldo: legal buttons moved to Profile screen */}
          <View className="mx-4 mt-2 mb-2 bg-white rounded-2xl overflow-hidden" style={cardShadow}>
            <Text className="text-[15px] font-semibold text-gray-800 tracking-wide px-4 pt-3.5 pb-1.5">
              LEGAL
            </Text>

            <TouchableOpacity
              className="flex-row items-center px-4 py-4 border-t border-gray-100"
              onPress={() => router.push('/(tabs)/termsConditions')}
              activeOpacity={0.75}
            >
              <View className="w-9 h-9 rounded-lg bg-brand-background items-center justify-center mr-3">
                <Feather name="file-text" size={15} color="#0d1b3e" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-gray-900">Terms & Conditions</Text>
                <Text className="text-[12px] font-semibold text-gray-500 mt-0.5">Review app terms</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-4 border-t border-gray-100"
              onPress={() => router.push('/(tabs)/privacyPolicy')}
              activeOpacity={0.75}
            >
              <View className="w-9 h-9 rounded-lg bg-brand-background items-center justify-center mr-3">
                <Feather name="shield" size={15} color="#0d1b3e" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-gray-900">Privacy Policy</Text>
                <Text className="text-[12px] font-semibold text-gray-500 mt-0.5">How your data is used</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Delete */}
          <View className="mx-4">
            <TouchableOpacity
              className="bg-white rounded-xl h-16 flex-row items-center justify-center gap-2 border border-red-200"
              onPress={() => setDeleteModalVisible(true)}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={20} color="#D32F2F" />
              <Text className="text-damascus-primary text-[15px] font-medium">Delete account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Delete sheet */}
      <Modal visible={deleteModalVisible} transparent animationType="slide" onRequestClose={closeDeleteModal}>
        <Pressable className="flex-1 justify-end bg-black/45" onPress={closeDeleteModal}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-t-3xl px-6 pt-4 pb-10">
              <View className="w-8 h-1 bg-gray-200 rounded-full self-center mb-5" />

              <View className="w-13 h-13 rounded-full bg-red-50 items-center justify-center self-center mb-3">
                <Feather name="trash-2" size={30} color="#D32F2F" />
              </View>

              <Text className="text-[20px] font-semibold text-gray-900 text-center mb-1.5">
                Delete account?
              </Text>
              <Text className="text-[15px] text-gray-600 text-center leading-7 mb-6">
                Are you sure you want to permanently delete your account? {'\n'} Your shift history will be preserved for payroll records, but your login access will be removed and this cannot be undone. {'\n'} Tap outside to cancel.
              </Text>

              <Text className="text-[11px] font-semibold text-gray-900 tracking-wide mb-2">
                CONFIRM PASSWORD
              </Text>
              <TextInput
                className={`h-16 bg-gray-50 border rounded-xl px-4 text-[14px] text-gray-900 mb-4 ${deleteError ? 'border-red-400' : 'border-gray-400'
                  }`}
                placeholder="Enter your password"
                placeholderTextColor="#c0c0c0"
                secureTextEntry
                value={password}
                onChangeText={(t) => {
                  setPassword(t)
                  setDeleteError(null)
                }}
                autoCapitalize="none"
                editable={!deleting}
              />

              {deleteError && (
                <View className="flex-row items-center gap-1.5 mb-3">
                  <Feather name="alert-circle" size={13} color="#D32F2F" />
                  <Text className="text-[13px] text-red-500">{deleteError}</Text>
                </View>
              )}

              <View className="items-center">
                <TouchableOpacity
                  className="h-16 w-1/2 bg-damascus-primary rounded-xl items-center justify-center"
                  onPress={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text className="text-white text-[16px] font-semibold">Delete account</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

function InfoRow({ icon, label, value, last = false }: {
  icon: string; label: string; value: string; last?: boolean
}) {
  return (
    <View className={`flex-row items-center px-4 py-3 ${!last ? 'border-t border-gray-100' : 'border-t border-gray-100'}`}>
      <View className="w-9 h-9 rounded-lg bg-brand-background items-center justify-center mr-3">
        <Feather name={icon as any} size={15} color="#0d1b3e" />
      </View>
      <View className="flex-1">
        <Text className="text-[12px] font-semibold text-gray-500">{label}</Text>
        <Text className="text-[15px] font-semibold text-gray-900 mt-0.5">{value}</Text>
      </View>
    </View>
  )
}