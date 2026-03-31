// apps/mobile/app/(tabs)/recognition.tsx

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";

type Recognition = {
  id: string;
  message: string;
  badge_icon: string;
  created_at: string;
  sender_id: string;
  senderName: string;
  senderAvatar: string | null;
};

type CardColor = {
  accent: string;
  icon: string;
};

const CARD_COLORS: CardColor[] = [
  { accent: "#3A9AFF", icon: "star" },
  { accent: "#0d1b3e", icon: "thumbs-up" },
  { accent: "#261CC1", icon: "award" },
  { accent: "#62CCEF", icon: "zap" },
];

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function RecognitionScreen() {
  const { user } = useAuth();
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchRecognitions();
  }, [user]);

  async function fetchRecognitions() {
    try {
      // Step 1: fetch recognitions
      const { data: recData, error: recError } = await supabase
        .from("recognitions")
        .select("id, message, badge_icon, created_at, sender_id")
        .eq("receiver_id", user?.id)
        .order("created_at", { ascending: false });

      if (recError || !recData) {
        console.log("Recognition error:", recError);
        return;
      }

      // Step 2: fetch sender profiles
      const senderIds = [
        ...new Set(recData.map((r) => r.sender_id).filter(Boolean)),
      ];

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);

      const profileMap: {
        [key: string]: { full_name: string; avatar_url: string | null };
      } = {};

      (profileData ?? []).forEach((p) => {
        profileMap[p.id] = {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
        };
      });

      // Step 3: merge
      const merged = recData.map((rec) => ({
        ...rec,
        senderName: profileMap[rec.sender_id]?.full_name ?? "Your manager",
        senderAvatar: profileMap[rec.sender_id]?.avatar_url ?? null,
      }));

      setRecognitions(merged);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecognitions();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-brand-background">
        <ActivityIndicator size="large" color="#62CCEF" />
      </View>
    );
  }

  const thisMonth = recognitions.filter((r) => {
    const d = new Date(r.created_at);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <View className="flex-1 bg-brand-background">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#62CCEF"
          />
        }
      >
        {/* This month line */}
        {thisMonth > 0 && (
          <View className="flex-row items-center gap-4 mb-5">
            <Feather name="trending-up" size={30} color="#05CC66" />
            <Text style={{ fontSize: 20, color: "#888" }}>
              <Text style={{ color: "#05CC66", fontWeight: "600" }}>
                {thisMonth}
              </Text>{" "}
              recognition{thisMonth > 1 ? "s" : ""} this month
            </Text>
          </View>
        )}

        {/* Empty state */}
        {recognitions.length === 0 ? (
          <View className="items-center justify-center mt-24">
            <View className="w-16 h-16 rounded-2xl bg-white items-center justify-center mb-4 border border-gray-100">
              <Feather name="award" size={28} color="#62CCEF" />
            </View>
            <Text
              style={{
                color: "#0d1b3e",
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              No recognitions yet
            </Text>
            <Text
              style={{
                color: "#aaa",
                fontSize: 14,
                textAlign: "center",
                paddingHorizontal: 40,
                lineHeight: 22,
              }}
            >
              When your manager appreciates your work, it will show up here.
            </Text>
          </View>
        ) : (
          recognitions.map((rec, index) => {
            const color = CARD_COLORS[index % CARD_COLORS.length];
            const { date, time } = formatDateTime(rec.created_at);
            const initials = getInitials(rec.senderName);

            return (
              <View
                key={rec.id}
                className="bg-white rounded-2xl mb-3 overflow-hidden"
                style={{
                  borderWidth: 0.5,
                  borderColor: "rgba(0,0,0,0.06)",
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                }}
              >
                {/* Colored header */}
                <View
                  style={{
                    backgroundColor: color.accent,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                  className="flex-row items-center gap-3"
                >
                  {/* Badge icon */}
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                    }}
                    className="items-center justify-center"
                  >
                    <Feather name={color.icon as any} size={18} color="white" />
                  </View>

                  {/* Sender info */}
                  <View className="flex-1">
                    <Text
                      style={{ color: "white", fontSize: 15, fontWeight: "600" }}
                    >
                      {rec.senderName}
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: 13,
                        marginTop: 1,
                      }}
                    >
                      Manager · {date}, {time}
                    </Text>
                  </View>

                  {/* Avatar */}
                  {rec.senderAvatar ? (
                    <Image
                      source={{ uri: rec.senderAvatar }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        borderWidth: 1.5,
                        borderColor: "rgba(255,255,255,0.4)",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: "rgba(255,255,255,0.25)",
                        borderWidth: 1.5,
                        borderColor: "rgba(255,255,255,0.4)",
                      }}
                      className="items-center justify-center"
                    >
                      <Text
                        style={{ color: "white", fontSize: 11, fontWeight: "600" }}
                      >
                        {initials}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Message body */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                  <Text style={{ color: "#031245", fontSize: 15, lineHeight: 22 }}>
                    {rec.message}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}