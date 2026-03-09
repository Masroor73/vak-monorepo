import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  shiftId: string;
};

export default function SwapModal({ visible, onClose, shiftId }: Props) {
  const { user } = useAuth();

  const [eligibleShifts, setEligibleShifts] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadEligibleShifts();
    }
  }, [visible]);

  async function loadEligibleShifts() {
    const { data, error } = await supabase
      .from("shifts")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    setEligibleShifts(data || []);
  }

  async function sendSwapRequest() {
    if (!selectedShift) return;

    const { error } = await supabase
      .from("shift_swaps")
      .insert({
        requester_id: user?.id,
        shift_id: shiftId,
        target_shift_id: selectedShift,
        status: "pending",
      });

    if (error) {
      console.log(error);
      return;
    }

    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center bg-black/40 px-6">
        <View className="bg-white rounded-xl p-6">

          <Text className="text-lg font-bold mb-4">
            Request Shift Swap
          </Text>

          <ScrollView className="max-h-60">

            {eligibleShifts.map((shift) => (
              <Pressable
                key={shift.id}
                onPress={() => setSelectedShift(shift.id)}
                className={`p-3 border rounded mb-2 ${
                  selectedShift === shift.id ? "bg-blue-100" : ""
                }`}
              >
                <Text>
                  {shift.start_time} - {shift.end_time}
                </Text>
              </Pressable>
            ))}

          </ScrollView>

          <Pressable
            onPress={sendSwapRequest}
            className="bg-blue-500 p-3 rounded mt-4"
          >
            <Text className="text-white text-center">
              Send Swap Request
            </Text>
          </Pressable>

          <Pressable onPress={onClose} className="mt-3">
            <Text className="text-center text-gray-500">
              Cancel
            </Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}