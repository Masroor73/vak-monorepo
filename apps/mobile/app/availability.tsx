import { useEffect, useState } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function SetAvailability() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadAvailability();
    }
  }, [user]);

  async function loadAvailability() {
    const { data, error } = await supabase
      .from("availabilities")
      .select("*")
      .eq("user_id", user?.id);

    if (error) {
      console.log(error);
      return;
    }

    setAvailability(data || []);
  }

  function isDayAvailable(day: string) {
    const record = availability.find((a) => a.day_of_week === day);
    return record?.is_available || false;
  }

  async function toggleDay(day: string, value: boolean) {
    const existing = availability.find((a) => a.day_of_week === day);

    // 🔹 Update UI instantly
    setAvailability((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((a) => a.day_of_week === day);

      if (index !== -1) {
        updated[index].is_available = value;
      } else {
        updated.push({
          day_of_week: day,
          is_available: value,
        });
      }

      return updated;
    });

    if (existing) {
      const { error } = await supabase
        .from("availabilities")
        .update({ is_available: value })
        .eq("id", existing.id);

      if (error) console.log(error);
    } else {
      const { error } = await supabase
        .from("availabilities")
        .insert({
          user_id: user?.id,
          day_of_week: day,
          start_time: "09:00",
          end_time: "17:00",
          is_available: value,
        });

      if (error) console.log(error);
    }
  }

  return (
    <View className="flex-1 bg-brand-background">
      {/* Header */}
      <View className="bg-brand-secondary pt-6 pb-16 px-5">
        <Text className="text-white font-bold text-lg text-center">
          Availability
        </Text>
      </View>

      {/* Content */}
      <View className="-mt-8 flex-1 px-4">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-3xl shadow-xl px-5 py-5">
            {DAYS.map((day) => (
              <View
                key={day}
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
              >
                <Text className="text-base font-semibold text-gray-800">
                  {day}
                </Text>

                <Switch
                  value={isDayAvailable(day)}
                  onValueChange={(value) => toggleDay(day, value)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}