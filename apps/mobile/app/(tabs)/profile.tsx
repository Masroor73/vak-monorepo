import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import Header from "@/src/components/Header";
import UserInfo from "@/src/components/UserInfo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Tab = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function Tab({ icon, label, onPress }: Tab) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-5 border-b border-gray-200"
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color="#333" />
      <Text className="ml-4 text-base">{label}</Text>
    </TouchableOpacity>
  );
}

const Profile = () => {
  const router = useRouter();
  const { user } = useAuth();

  const uploadPhoto = async () => {
    try {

      // ✅ REQUEST PERMISSION
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow access to your gallery.");
        return;
      }

      // ✅ OPEN GALLERY
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (result.canceled) return;

      const image = result.assets[0];

      const fileName = `${user?.id}.jpg`;

      const response = await fetch(image.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true });

      if (uploadError) {
        console.log(uploadError);
        Alert.alert("Upload failed");
        return;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user?.id);

      Alert.alert("Profile photo updated!");

    } catch (error) {
      console.log(error);
    }
  };

  const tabs: Tab[] = [
    { icon: "globe-outline", label: "Location", onPress: () => {} },
    { icon: "shield-outline", label: "Privacy Policy", onPress: () => {} },
    { icon: "settings-outline", label: "Notification Preferences", onPress: () => {} },
    { icon: "help-circle-outline", label: "Help and Support", onPress: () => {} },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <Header title="My Profile" />

      {/* Tap profile to upload photo */}
      <TouchableOpacity onPress={uploadPhoto}>
        <UserInfo />
      </TouchableOpacity>

      <View className="px-8 mt-2">
        {tabs.map((item, index) => (
          <Tab
            key={index}
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default Profile;