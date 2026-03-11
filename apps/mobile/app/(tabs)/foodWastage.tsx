import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, Modal,
} from 'react-native';
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

export default function ReportFoodWastage() {
  const router = useRouter();
  const { user } = useAuth();

  const [itemName, setItemName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startErrorTimer = () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrors({}), 20000);
  };

  const pickImage = async (source: 'library' | 'camera') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) return;

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setLocalPhotoUri(uri);
      setUploadedPhotoUrl(null);
      setErrors((prev) => ({ ...prev, photo_url: undefined }));
      await uploadPhoto(uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setUploadingPhoto(true);
      const path = `${user!.id}/${Date.now()}.jpg`;

      const formData = new FormData();
      formData.append('file', { uri, name: path, type: 'image/jpeg' } as any);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/waste-log-photos/${path}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'x-upsert': 'true',
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }

      const { data: urlData } = supabase.storage.from('waste-log-photos').getPublicUrl(path);
      setUploadedPhotoUrl(urlData.publicUrl);
    } catch {
      setUploadedPhotoUrl(null);
      setErrors((prev) => ({ ...prev, photo_url: 'Upload failed. Remove and try again.' }));
      startErrorTimer();
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setLocalPhotoUri(null);
    setUploadedPhotoUrl(null);
    setErrors((prev) => ({ ...prev, photo_url: undefined }));
  };

  const validate = (): boolean => {
    if (!user) return false;

    const result = WasteLogSchema.safeParse({
      reporter_id: user.id,
      item_name: itemName.trim(),
      estimated_cost: Number(estimatedCost),
      photo_url: uploadedPhotoUrl ?? '',
    });

    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: FormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FormErrors;
      if (field === 'item_name') newErrors.item_name = issue.message;
      if (field === 'estimated_cost') newErrors.estimated_cost = issue.message;
      if (field === 'photo_url') newErrors.photo_url = issue.message;
    }
    setErrors(newErrors);
    startErrorTimer();
    return false;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('waste_logs').insert({
        reporter_id: user.id,
        item_name: itemName.trim(),
        estimated_cost: Number(estimatedCost),
        photo_url: uploadedPhotoUrl,
      });

      if (error) throw error;
      setShowSuccess(true);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, submit: err.message || 'Something went wrong. Please try again.' }));
      startErrorTimer();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-brand-secondary">

      {/* ── Success Modal ── */}
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

      {/* ── Header ── */}
      <View className="bg-brand-secondary pt-10 pb-14 px-5 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-[17px] tracking-wide">
          Report Food Wastage
        </Text>
        <View className="w-10" />
      </View>

      {/* ── Body ── */}
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
          {/* ── Banner ── */}
          <View className="flex-row items-center gap-3 px-5 py-4 rounded-lg bg-brand-primary/10 border-b border-brand-primary/20">
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-brand-primary">
              <MaterialCommunityIcons name="food-off" size={18} color="#fff" />
            </View>
            <Text className="text-brand-secondary text-[15px] font-semibold flex-1 leading-5">
              Submitting this report helps us track and reduce food waste.
            </Text>
          </View>

          {/* ── Form ── */}
          <View className="px-5 pt-5 pb-3">

            {/* Submit error */}
            {errors.submit && (
              <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text className="text-red-600 text-[13px] flex-1">{errors.submit}</Text>
              </View>
            )}

            {/* Item Name */}
            <Text className="text-[13px] font-bold text-gray-600 uppercase tracking-widest mb-2">
              Item Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`bg-white border rounded-lg px-4 py-3.5 text-gray-900 text-[15px] mb-1 ${errors.item_name ? 'border-red-500' : 'border-gray-400'}`}
              placeholder="e.g. Chicken breast, Salad mix..."
              placeholderTextColor="#6B7280"
              value={itemName}
              onChangeText={setItemName}
            />
            {errors.item_name
              ? <Text className="text-red-500 text-[14px] font-semibold mb-3 ml-1">{errors.item_name}</Text>
              : <View className="mb-4" />
            }

            <View className="h-px bg-gray-200 mb-5" />

            {/* Estimated Cost */}
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
              />
            </View>
            {errors.estimated_cost
              ? <Text className="text-red-500 text-[14px] font-semibold mb-3 ml-1">{errors.estimated_cost}</Text>
              : <View className="mb-4" />
            }

            <View className="h-px bg-gray-200 mb-3" />

            {/* Photo */}
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
                {uploadingPhoto ? (
                  <View className="flex-row items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200" style={{ borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                    <ActivityIndicator size="small" color="#374151" />
                    <Text className="text-gray-600 text-[13px] font-semibold">Uploading photo...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200" style={{ borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                    {uploadedPhotoUrl ? (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                        <Text className="text-green-600 text-[13px] font-semibold">Uploaded successfully</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="alert-circle" size={16} color="#ef4444" />
                        <Text className="text-red-500 text-[13px] font-semibold">Upload failed</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={removePhoto}
                      className="flex-row items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5"
                    >
                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      <Text className="text-red-500 text-[12px] font-semibold">Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View className={`border rounded-lg bg-gray-50 ${errors.photo_url ? 'border-red-500' : 'border-gray-400'}`}>
                <TouchableOpacity onPress={() => pickImage('camera')} className="flex-row items-center gap-3 px-4 py-4" activeOpacity={0.7}>
                  <View className="w-9 h-9 rounded-xl items-center justify-center bg-brand-secondary">
                    <Ionicons name="camera-outline" size={18} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 text-[13px] font-semibold">Take a photo</Text>
                    <Text className="text-gray-500 text-[11px] mt-0.5">Use your camera</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>

                <View className="h-px bg-gray-200 mx-4" />

                <TouchableOpacity onPress={() => pickImage('library')} className="flex-row items-center gap-3 px-4 py-4" activeOpacity={0.7}>
                  <View className="w-9 h-9 rounded-xl items-center justify-center bg-brand-secondary">
                    <Ionicons name="image-outline" size={18} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 text-[13px] font-semibold">Choose from library</Text>
                    <Text className="text-gray-500 text-[11px] mt-0.5">Pick an existing photo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            )}
            {errors.photo_url && (
              <Text className="text-red-500 text-[14px] font-semibold mt-2 ml-1">{errors.photo_url}</Text>
            )}

          </View>
        </View>
      </ScrollView>

      {/* ── Submit ── */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-3 bg-brand-background border-t border-gray-300">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || uploadingPhoto}
          className={`rounded-2xl py-5 items-center justify-center ${submitting || uploadingPhoto ? 'bg-gray-300' : 'bg-brand-secondary'}`}
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