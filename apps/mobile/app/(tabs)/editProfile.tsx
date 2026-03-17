import { useState, useEffect, useRef } from 'react'
import {View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, StatusBar, Image} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { EditProfileSchema, EditProfileInput } from '@vak/contract'

const MAX_FILE_SIZE_MB = 5

export default function EditProfileScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)
  const photoErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<EditProfileInput>({
    resolver: zodResolver(EditProfileSchema),
    defaultValues: { full_name: '', phone_number: '', email: '' },
    mode: 'onSubmit',
  })

  const watchedFullName = watch('full_name')
  const initials = watchedFullName
    ? watchedFullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  function setPhotoErrorWithTimer(msg: string) {
    setPhotoError(msg)
    if (photoErrorTimer.current) clearTimeout(photoErrorTimer.current)
    photoErrorTimer.current = setTimeout(() => setPhotoError(null), 10000)
  }

  useEffect(() => {
    return () => { if (photoErrorTimer.current) clearTimeout(photoErrorTimer.current) }
  }, [])

  useEffect(() => {
    if (!user) return
    loadProfile()
  }, [user])

  async function loadProfile() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone_number, email, avatar_url')
      .eq('id', user!.id)
      .single()
    if (error) { console.error(error); setLoading(false); return }
    reset({
      full_name: data.full_name ?? '',
      phone_number: data.phone_number ?? '',
      email: data.email ?? '',
    })
    setAvatarUrl(data.avatar_url ?? null)
    setLoading(false)
  }

  async function pickImage(source: 'camera' | 'library') {
    setPhotoError(null)
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      setPhotoErrorWithTimer('Permission denied. Please allow access in Settings.')
      return
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true, aspect: [1, 1], quality: 0.7,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        })

    if (result.canceled || !result.assets?.[0]) return

    const { uri, fileSize } = result.assets[0]

    let size = fileSize
    if (!size) {
      const response = await fetch(uri)
      const blob = await response.blob()
      size = blob.size
    }

    if (size && size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setPhotoErrorWithTimer(`Image must be under ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    await uploadImage(uri)
  }

  async function uploadImage(uri: string) {
    setUploadingPhoto(true)
    setPhotoError(null)
    try {
      const ext = uri.split('.').pop() ?? 'jpg'
      const path = `avatars/${user!.id}.${ext}`

      const response = await fetch(uri)
      const arrayBuffer = await response.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { upsert: true, contentType: `image/${ext}` })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user!.id)

      if (updateError) throw updateError

      setAvatarUrl(data.publicUrl)
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      setPhotoErrorWithTimer('Upload failed. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const onSave = async (data: EditProfileInput) => {
    if (!user) return
    if (uploadingPhoto) {
      Alert.alert('Please wait', 'Photo is still uploading.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name.trim(),
          phone_number: data.phone_number?.trim() || null,
          email: data.email.trim(),
        })
        .eq('id', user.id)
      if (error) throw new Error(error.message)
      router.back()
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

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
      <SafeAreaView className="flex-1 bg-brand-background" edges={['bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowPhotoPicker(false) }}>
            <ScrollView
              className="bg-brand-background"
              contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Header */}
              <View className="bg-brand-secondary px-5 pt-8 pb-8 flex-row items-center">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="w-9 h-9 rounded-full border border-white/20 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Feather name="arrow-left" size={16} color="#fff" />
                </TouchableOpacity>
                <Text className="flex-1 text-white text-[17px] font-medium text-center mr-9">
                  Edit Profile
                </Text>
              </View>

              {/* Avatar card */}
              <View className="mx-4 mt-8">
                <TouchableOpacity
                  onPress={() => setShowPhotoPicker(!showPhotoPicker)}
                  activeOpacity={0.8}
                  className="bg-white rounded-2xl p-3.5 flex-row items-center gap-3.5"
                  style={cardShadow}
                  disabled={uploadingPhoto}
                >
                  <View className="w-14 h-14 rounded-full bg-brand-secondary items-center justify-center">
                    {avatarUrl ? (
                      <Image
                        source={{ uri: avatarUrl }}
                        className="w-14 h-14 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-white text-[20px] font-medium">{initials}</Text>
                    )}
                    {uploadingPhoto && (
                      <View className="absolute w-14 h-14 rounded-full bg-black/45 items-center justify-center">
                        <ActivityIndicator color="#fff" size="small" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-gray-900">
                      {watchedFullName || '—'}
                    </Text>
                    <Text className={`text-[13px] mt-0.5 ${uploadingPhoto ? 'text-brand-primary' : 'text-gray-600'}`}>
                      {uploadingPhoto ? 'Uploading photo...' : 'Tap to change photo'}
                    </Text>
                  </View>
                  <View className="w-9 h-9 rounded-full bg-brand-background items-center justify-center">
                    <Feather name={showPhotoPicker ? 'chevron-up' : 'camera'} size={14} color="#0d1b3e" />
                  </View>
                </TouchableOpacity>

                {/* Photo error */}
                {photoError && (
                  <View className="flex-row items-center gap-1.5 mt-1.5 ml-1">
                    <Feather name="alert-circle" size={12} color="#D32F2F" />
                    <Text className="text-[12px] text-damascus-primary">{photoError}</Text>
                  </View>
                )}

                {/* Inline picker */}
                {showPhotoPicker && !uploadingPhoto && (
                  <View className="mt-2 bg-white rounded-2xl overflow-hidden border border-gray-100" style={cardShadow}>
                    <TouchableOpacity
                      onPress={() => { setShowPhotoPicker(false); pickImage('camera') }}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-3 p-3.5"
                    >
                      <View className="w-9 h-9 rounded-[10px] bg-brand-secondary items-center justify-center">
                        <Feather name="camera" size={16} color="#fff" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-gray-900">Take a photo</Text>
                        <Text className="text-[13px] text-gray-600 mt-0.5">Use your camera</Text>
                      </View>
                      <Feather name="chevron-right" size={15} color="#c0c0c0" />
                    </TouchableOpacity>

                    <View className="h-px bg-gray-100 mx-3.5" />

                    <TouchableOpacity
                      onPress={() => { setShowPhotoPicker(false); pickImage('library') }}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-3 p-3.5"
                    >
                      <View className="w-9 h-9 rounded-[10px] bg-brand-secondary items-center justify-center">
                        <Feather name="image" size={16} color="#fff" />
                      </View>s
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-gray-900">Choose from library</Text>
                        <Text className="text-[13px] text-gray-600 mt-0.5">Pick an existing photo</Text>
                      </View>
                      <Feather name="chevron-right" size={15} color="#c0c0c0" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Form card */}
              <View className="mx-4 mt-8 mb-6 bg-white rounded-xl p-4 gap-3.5" style={cardShadow}>
                <Controller
                  control={control}
                  name="full_name"
                  render={({ field: { value, onChange } }) => (
                    <FormField
                      label="Full name"
                      placeholder="Your full name"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={(v) => onChange(v.replace(/[^a-zA-Z\s]/g, ''))}
                      error={errors.full_name?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="phone_number"
                  render={({ field: { value, onChange } }) => (
                    <FormField
                      label="Phone number"
                      placeholder="(xxx) xxx-xxxx"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      value={value ?? ''}
                      onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
                      error={errors.phone_number?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { value, onChange } }) => (
                    <FormField
                      label="Email"
                      placeholder="your@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                      error={errors.email?.message}
                    />
                  )}
                />
              </View>

              {/* Save button */}
              <View className="mx-4 mt-3">
                <TouchableOpacity
                  className={`rounded-xl h-16 items-center justify-center ${uploadingPhoto ? 'bg-gray-400' : 'bg-brand-secondary'}`}
                  onPress={handleSubmit(onSave)}
                  disabled={saving || uploadingPhoto}
                  activeOpacity={0.85}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text className="text-white font-semibold text-[15px]">
                        {uploadingPhoto ? 'Uploading photo...' : 'Save Changes'}
                      </Text>
                  }
                </TouchableOpacity>
              </View>

            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}

function FormField({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', autoCapitalize = 'sentences', error,
}: {
  label: string; value: string; onChangeText: (t: string) => void
  placeholder?: string; keyboardType?: any; autoCapitalize?: any; error?: string
}) {
  return (
    <View>
      <Text className="text-[14px] font-semibold text-gray-900 mb-1.5">
        {label}
      </Text>
      <TextInput
        className={`h-18 bg-gray-50 rounded-xl px-5 text-[15px] text-gray-900 border ${error ? 'border-damascus-primary' : 'border-gray-200'}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error && (
        <View className="flex-row items-center gap-1 mt-1">
          <Feather name="alert-circle" size={11} color="#D32F2F" />
          <Text className="text-[11px] text-damascus-primary">{error}</Text>
        </View>
      )}
    </View>
  )
}