import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

type Recognition = {
  id: string;
  message: string;
  badge_icon: string;
  created_at: string;
};

export default function RecognitionScreen() {
  const { user } = useAuth();

  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecognitions();
      console.log("Logged in user:", user?.id);
    }
  }, [user]);

  async function fetchRecognitions() {
    try {
      const { data, error } = await supabase
        .from("recognitions")
        .select("*")
        .eq("receiver_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Recognition error:", error);
      } else {
        setRecognitions(data || []);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F5F5" }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 20,
        }}
      >
        Recognition
      </Text>

      {recognitions.length === 0 ? (
        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "600", fontSize: 16 }}>
            No recognition yet
          </Text>

          <Text style={{ color: "#777", marginTop: 6 }}>
            When coworkers appreciate your work, it will appear here.
          </Text>
        </View>
      ) : (
        recognitions.map((rec) => (
          <View
            key={rec.id}
            style={{
              backgroundColor: "white",
              padding: 18,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              ⭐ {rec.message}
            </Text>

            <Text style={{ color: "#666", marginTop: 6 }}>
              Badge: {rec.badge_icon}
            </Text>

            <Text style={{ color: "#999", marginTop: 4 }}>
              {new Date(rec.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}