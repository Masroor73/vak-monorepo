import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal, } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { WasteLogSchema } from '@vak/contract';

interface FormErrors {
  item_name?: string;
  estimated_cost?: string;
  photo_url?: string;
  submit?: string;
}

const MAX_FILE_SIZE_MB = 5;

const FieldError = ({ message }: { message?: string }) =>
  message
    ? <Text className="text-red-500 text-[14px] font-semibold mb-3 ml-1">{message}</Text>
    : <View className="mb-4" />;

export default function ReportFoodWastage() {
  const router = useRouter();
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const setErrorsWithTimer = (next: FormErrors) => {
    setErrors(next);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrors({}), 20000);
  };

  const pickImage = async (source: 'library' | 'camera') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorsWithTimer({ photo_url: 'Permission denied. Please allow access in Settings.' });
      return;
    }

    const opts = { quality: 0.7, mediaTypes: ['images'] as ImagePicker.MediaType[] };

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);

    if (result.canceled || !result.assets?.[0]) return;

    const { uri, fileSize } = result.assets[0];

// Ensure we have a file size to enforce the limit
let size = fileSize;
if (!size) {
  const response = await fetch(uri);
  const blob = await response.blob();
  size = blob.size;
}

if (size > MAX_FILE_SIZE_MB * 1024 * 1024) {
  setErrorsWithTimer({ photo_url: `Image must be under ${MAX_FILE_SIZE_MB}MB.` });
  return;
}

setLocalPhotoUri(uri);
setErrors((prev) => ({ ...prev, photo_url: undefined }));
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setUploadingPhoto(true);

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const path = `${user!.id}/${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from('waste-log-photos')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg' });

      if (error) throw error;

      const { data } = supabase.storage
        .from('waste-log-photos')
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err?.message ?? JSON.stringify(err));
      setErrorsWithTimer({ photo_url: 'Upload failed. Please try again.' });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setLocalPhotoUri(null);
    setErrors((prev) => ({ ...prev, photo_url: undefined }));
  };

  const validate = (): boolean => {
    if (!user) return false;

    const result = WasteLogSchema.safeParse({
      reporter_id: user.id,
      item_name: itemName.trim(),
      estimated_cost: Number(estimatedCost),
      photo_url: localPhotoUri ? 'https://placeholder.com' : '',
    });

    if (result.success) { setErrors({}); return true; }

    const newErrors: FormErrors = {};
    for (const { path, message } of result.error.issues) {
      const field = path[0] as keyof FormErrors;
      if (!(field in newErrors)) newErrors[field] = message;
    }
    setErrorsWithTimer(newErrors);
    return false;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const photoUrl = localPhotoUri
        ? await uploadPhoto(localPhotoUri)
        : null;

      const { error } = await supabase.from('waste_logs').insert({
        reporter_id: user!.id,
        item_name: itemName.trim(),
        estimated_cost: Number(estimatedCost),
        photo_url: photoUrl,
      });

      if (error) throw error;

      setShowSuccess(true);
    } catch (err: any) {
      setErrorsWithTimer({ submit: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || uploadingPhoto;

  return (
    <View className="flex-1 bg-brand-secondary">

      <Modal visible={showSuccess} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <View className="bg-white rounded-3xl px-8 py-10 items-center w-full">
            <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={40} color="#22c55e" />
            </View>
            <Text className="text-gray-900 text-[18px] font-bold mb-2">Report Submitted!</Text>
            <Text className="text-gray-500 text-[14px] text-center mb-6">
              Thank you! Your food wastage report has been recorded successfully.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-brand-secondary rounded-2xl py-4 w-full items-center"
            >
              <Text className="text-white font-extrabold text-[13px] tracking-widest uppercase">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View className="bg-brand-secondary pt-10 pb-14 px-5 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-[17px] tracking-wide">Report Food Wastage</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="-mt-5 flex-1 bg-brand-background rounded-3xl"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View
          className="bg-white rounded-lg mt-5 mx-5"
          style={{ shadowColor: '#0d1b3e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 }}
        >

          <View className="flex-row items-center gap-3 px-5 py-4 rounded-lg bg-brand-primary/10 border-b border-brand-primary/20">
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-brand-primary">
              <MaterialCommunityIcons name="food-off" size={18} color="#fff" />
            </View>
            <Text className="text-brand-secondary text-[15px] font-semibold flex-1 leading-5">
              Submitting this report helps us track and reduce food waste.
            </Text>
          </View>

          <View className="px-5 pt-5 pb-3">

            {errors.submit && (
              <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text className="text-red-600 text-[13px] flex-1">{errors.submit}</Text>
              </View>
            )}

            {/* ITEM NAME */}

            <Text className="text-[13px] font-bold text-gray-600 uppercase tracking-widest mb-2">
              Item Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`bg-white border rounded-lg px-4 py-3.5 text-gray-900 text-[15px] mb-1 ${errors.item_name ? 'border-red-500' : 'border-gray-400'}`}
              placeholder="e.g. Chicken breast, Salad mix..."
              placeholderTextColor="#6B7280"
              value={itemName}
              onChangeText={setItemName}
              maxLength={100}
              returnKeyType="next"
            />
            <FieldError message={errors.item_name} />

            <View className="h-px bg-gray-200 mb-5" />

            {/* COST */}

            <Text className="text-[13px] font-bold text-gray-600 uppercase tracking-widest mb-2">
              Estimated Cost <Text className="text-red-500">*</Text>
            </Text>
            <View className={`flex-row items-center bg-white border rounded-lg px-4 mb-1 ${errors.estimated_cost ? 'border-red-500' : 'border-gray-400'}`}>
              <Text className="text-gray-600 text-[15px] font-semibold mr-2">$</Text>
              <TextInput
                className="flex-1 py-3.5 text-gray-900 text-[15px]"
                placeholder="0.00"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
                value={estimatedCost}
                onChangeText={setEstimatedCost}
                maxLength={10}
                returnKeyType="done"
              />
            </View>
            <FieldError message={errors.estimated_cost} />

            <View className="h-px bg-gray-200 mb-3" />

            {/* PHOTO */}

            <Text className="text-[13px] font-bold text-gray-600 uppercase tracking-widest mb-3">
              Photo <Text className="text-red-500">*</Text>
            </Text>

            {localPhotoUri ? (
              <View className="rounded-xl border border-gray-200">
                <Image
                  source={{ uri: localPhotoUri }}
                  style={{ width: '100%', height: 176, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <View
                  className="flex-row items-center justify-between px-2 py-3 bg-gray-50 border-t border-gray-200"
                  style={{ borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}
                >
                  {uploadingPhoto ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator size="small" color="#374151" />
                      <Text className="text-gray-600 text-[13px] font-semibold">Uploading...</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                      <Text className="text-green-600 text-[13px] font-semibold">Photo uploaded successfully</Text>
                    </View>
                  )}
                  {!uploadingPhoto && (
                    <TouchableOpacity
                      onPress={removePhoto}
                      className="flex-row items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5"
                    >
                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      <Text className="text-red-500 text-[12px] font-semibold">Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View className={`border rounded-lg bg-gray-50 ${errors.photo_url ? 'border-red-500' : 'border-gray-400'}`}>
                {(['camera', 'library'] as const).map((source, i) => (
                  <View key={source}>
                    {i > 0 && <View className="h-px bg-gray-200 mx-4" />}
                    <TouchableOpacity
                      onPress={() => pickImage(source)}
                      className="flex-row items-center gap-3 px-4 py-4"
                      activeOpacity={0.7}
                      disabled={uploadingPhoto}
                    >
                      <View className="w-9 h-9 rounded-xl items-center justify-center bg-brand-secondary">
                        <Ionicons name={source === 'camera' ? 'camera-outline' : 'image-outline'} size={18} color="#fff" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 text-[13px] font-semibold">
                          {source === 'camera' ? 'Take a photo' : 'Choose from library'}
                        </Text>
                        <Text className="text-gray-500 text-[11px] mt-0.5">
                          {source === 'camera' ? 'Use your camera' : 'Pick an existing photo'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {errors.photo_url && (
              <Text className="text-red-500 text-[14px] font-semibold mt-2 ml-1">{errors.photo_url}</Text>
            )}

          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-3 bg-brand-background border-t border-gray-300">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isDisabled}
          activeOpacity={0.8}
          className={`rounded-2xl py-5 items-center justify-center ${isDisabled ? 'bg-gray-300' : 'bg-brand-secondary'}`}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-extrabold text-[13px] tracking-widest uppercase">Submit Report</Text>
          }
        </TouchableOpacity>
      </View>

    </View>
  );
}