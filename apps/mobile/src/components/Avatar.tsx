import React, { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const Avatar = () => {

  const { user } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    loadAvatar();
  }, [user]);

  const loadAvatar = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (data?.avatar_url) {
      setAvatar(data.avatar_url);
    }
  };

  if (avatar) {
    return (
      <Image
        source={{ uri: avatar }}
        style={{
          width: 90,
          height: 90,
          borderRadius: 45,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#e5e7eb",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons name="person" size={40} color="#6b7280" />
    </View>
  );
};

export default Avatar;