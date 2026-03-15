import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  shiftId: string;
  role: string;
};

export default function SwapModal({ visible, onClose, shiftId, role }: Props) {
  const { user } = useAuth();

  const [eligibleShifts, setEligibleShifts] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadEligibleShifts();
    }
  }, [visible]);

  async function loadEligibleShifts() {
    if (!user) return;

    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("role_at_time_of_shift", role) // same role
      .neq("employee_id", user.id) // different employee
      .order("start_time", { ascending: true });

    if (error) {
      console.log("Error loading shifts:", error);
      return;
    }

    setEligibleShifts(data || []);
  }

  async function sendSwapRequest() {
    if (!selectedShift || !selectedEmployee || !user) return;

    const { error } = await supabase
      .from("shift_swaps")
      .insert({
        requester_id: user.id,
        recipient_id: selectedEmployee,
        shift_id: shiftId,
        target_shift_id: selectedShift,
        status: "pending",
        reason: "Shift swap request",
      });

    if (error) {
      console.log("Swap request error:", error);
      return;
    }

    setSelectedShift(null);
    setSelectedEmployee(null);
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

            {eligibleShifts.length === 0 && (
              <Text className="text-gray-500">
                No eligible shifts available
              </Text>
            )}

            {eligibleShifts.map((shift) => (
              <Pressable
                key={shift.id}
                onPress={() => {
                  setSelectedShift(shift.id);
                  setSelectedEmployee(shift.employee_id);
                }}
                className={`p-3 border rounded mb-2 ${
                  selectedShift === shift.id ? "bg-blue-100" : ""
                }`}
              >
                <Text>
                  {new Date(shift.start_time).toLocaleTimeString()} -{" "}
                  {new Date(shift.end_time).toLocaleTimeString()}
                </Text>
              </Pressable>
            ))}

          </ScrollView>

          <Pressable
            onPress={sendSwapRequest}
            className="bg-blue-500 p-3 rounded mt-4"
          >
            <Text className="text-white text-center font-semibold">
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