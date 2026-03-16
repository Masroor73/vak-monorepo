import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  shiftId: string;
  role: string | null | undefined;
};

type EligibleShift = {
  id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  role_at_time_of_shift: string;
  status?: string;
  location_id?: string | null;
};

export default function SwapModal({
  visible,
  onClose,
  shiftId,
  role,
}: Props) {
  const { user } = useAuth();

  const [eligibleShifts, setEligibleShifts] = useState<EligibleShift[]>([]);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) {
      loadEligibleShifts();
    } else {
      setEligibleShifts([]);
      setSelectedShift(null);
      setSelectedEmployee(null);
    }
  }, [visible, role, user?.id]);

  async function loadEligibleShifts() {
    if (!user || !role) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("role_at_time_of_shift", role)
        .neq("employee_id", user.id)
        .gt("start_time", new Date().toISOString())
        .neq("status", "COMPLETED")
        .order("start_time", { ascending: true });

      if (error) {
        console.log("Error loading shifts:", error);
        Alert.alert("Error", "Failed to load eligible shifts.");
        return;
      }

      setEligibleShifts((data as EligibleShift[]) || []);
    } finally {
      setLoading(false);
    }
  }

  async function sendSwapRequest() {
    if (!selectedShift || !selectedEmployee || !user) {
      Alert.alert("Missing selection", "Please choose a shift first.");
      return;
    }

    try {
      setSending(true);

      const { error } = await supabase.from("shift_swaps").insert({
        requester_id: user.id,
        recipient_id: selectedEmployee,
        shift_id: shiftId,
        target_shift_id: selectedShift,
        status: "PENDING",
        reason: "Shift swap request",
      });

      if (error) {
        console.log("Swap request error:", error);
        Alert.alert("Error", "Failed to send swap request.");
        return;
      }

      Alert.alert("Success", "Swap request sent successfully.");
      setSelectedShift(null);
      setSelectedEmployee(null);
      onClose();
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center bg-black/40 px-6">
        <View className="bg-white rounded-xl p-6">
          <Text className="text-lg font-bold mb-4">Request Shift Swap</Text>

          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-500 mt-3">
                Loading eligible shifts...
              </Text>
            </View>
          ) : (
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
                    selectedShift === shift.id
                      ? "bg-blue-100 border-blue-400"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text className="font-semibold text-gray-800">
                    {shift.role_at_time_of_shift}
                  </Text>

                  <Text className="text-gray-600 mt-1">
                    {new Date(shift.start_time).toLocaleDateString()} •{" "}
                    {new Date(shift.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(shift.end_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>

                  {shift.location_id ? (
                    <Text className="text-xs text-gray-400 mt-1">
                      {shift.location_id}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Pressable
            onPress={sendSwapRequest}
            disabled={!selectedShift || sending}
            className={`p-3 rounded mt-4 ${
              !selectedShift || sending ? "bg-gray-300" : "bg-blue-500"
            }`}
          >
            <Text className="text-white text-center font-semibold">
              {sending ? "Sending..." : "Send Swap Request"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} className="mt-3">
            <Text className="text-center text-gray-500">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}