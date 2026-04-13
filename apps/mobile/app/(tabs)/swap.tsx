import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, RefreshControl, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Swap = {
  id: string;
  status: string;
  reason: string | null;
  created_at: string;
  shift_id: string;
  recipient_id: string;
};

type ShiftInfo = {
  id: string;
  start_time: string;
  end_time: string;
  role_at_time_of_shift: string;
};

type RecipientInfo = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  PENDING:  { label: "Pending",  color: "#FBC02D", icon: "time-outline" },
  APPROVED: { label: "Approved", color: "#05CC66", icon: "checkmark-circle" },
  DENIED:   { label: "Denied",   color: "#D32F2F", icon: "close-circle" },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatShiftDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function formatRole(role: string) {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ConfirmWithdrawModal({
  visible,
  onCancel,
  onConfirm,
  error,
  loading,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  error: string | null;
  loading: boolean;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-white rounded-t-3xl px-6 pt-4 pb-10">
          <View className="w-8 h-1 bg-gray-200 rounded-full self-center mb-5" />

          <View className="w-14 h-14 rounded-full bg-red-50 items-center justify-center self-center mb-3">
            <Ionicons name="swap-horizontal-outline" size={28} color="#D32F2F" />
          </View>

          <Text className="text-[20px] font-semibold text-gray-900 text-center mb-1.5">
            Withdraw request?
          </Text>
          <Text className="text-[15px] text-gray-500 text-center leading-6 mb-6">
            This will cancel your swap request. The other employee will no longer be notified.
          </Text>

          {error && (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
              <Ionicons name="alert-circle-outline" size={14} color="#D32F2F" />
              <Text className="text-red-500 text-[13px] flex-1">{error}</Text>
            </View>
          )}

          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 h-14 rounded-xl border border-gray-200 items-center justify-center"
            >
              <Text className="text-gray-700 font-semibold text-[15px]">Keep</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              className="flex-1 h-14 rounded-xl bg-damascus-primary items-center justify-center"
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text className="text-white font-semibold text-[15px]">Withdraw</Text>
              }
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SwapScreen() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [shiftMap, setShiftMap] = useState<Record<string, ShiftInfo>>({});
  const [recipientMap, setRecipientMap] = useState<Record<string, RecipientInfo>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<Swap | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    loadSwaps();
    const channel = supabase
      .channel("swap-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "shift_swaps" }, loadSwaps)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadSwaps() {
    if (!user) return;

    const { data, error } = await supabase
      .from("shift_swaps")
      .select("*")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    if (error) { setLoading(false); setRefreshing(false); return; }

    const swapData = data || [];
    setSwaps(swapData);

    const shiftIds = [...new Set(swapData.map((s) => s.shift_id))];
    if (shiftIds.length > 0) {
      const { data: shifts } = await supabase
        .from("shifts")
        .select("id, start_time, end_time, role_at_time_of_shift")
        .in("id", shiftIds);
      const map: Record<string, ShiftInfo> = {};
      (shifts || []).forEach((s) => { map[s.id] = s; });
      setShiftMap(map);
    }

    const recipientIds = [...new Set(swapData.map((s) => s.recipient_id).filter(Boolean))];
    if (recipientIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", recipientIds);
      const rMap: Record<string, RecipientInfo> = {};
      (profiles || []).forEach((p) => { rMap[p.id] = p; });
      setRecipientMap(rMap);
    }

    setLoading(false);
    setRefreshing(false);
  }

  const handleWithdrawConfirm = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    setWithdrawError(null);
    const { error } = await supabase.from("shift_swaps").delete().eq("id", withdrawTarget.id);
    if (error) {
      setWithdrawError(error.message);
      setWithdrawing(false);
      return;
    }
    setSwaps((prev) => prev.filter((s) => s.id !== withdrawTarget.id));
    setWithdrawTarget(null);
    setWithdrawing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator size="large" color="#0d1b3e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 56 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadSwaps(); }}
            tintColor="#0d1b3e"
          />
        }
      >
        {swaps.length === 0 ? (
          <View style={{ marginTop: 72, alignItems: "center", paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔄</Text>
            <Text style={{ color: "#0d1b3e", fontSize: 18, fontWeight: "800", marginBottom: 6 }}>
              No swap requests yet
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 14, textAlign: "center" }}>
              When you request a shift swap, it'll appear here.
            </Text>
          </View>
        ) : (
          swaps.map((swap) => {
            const shift     = shiftMap[swap.shift_id];
            const recipient = recipientMap[swap.recipient_id];
            const cfg       = STATUS_CONFIG[swap.status] ?? STATUS_CONFIG["PENDING"];

            return (
              <View
                key={swap.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  marginBottom: 12,
                  overflow: "hidden",
                  shadowColor: "#0d1b3e",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View style={{ height: 3, backgroundColor: cfg.color }} />

                <View style={{ padding: 16 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <Text style={{ color: cfg.color, fontSize: 13, fontWeight: "700" }}>
                        {cfg.label.toUpperCase()}
                      </Text>
                      <Text style={{ color: "rgba(13,27,62,0.35)", fontSize: 14, fontWeight: "800" }}>
                        {formatRelativeDate(swap.created_at)}
                      </Text>
                    </View>

                    <Text style={{ color: "#0d1b3e", fontSize: 20, marginBottom: 2, fontWeight: "800" }}>
                      Requested to swap with
                    </Text>
                    <Text style={{ color: "gray", fontSize: 18, fontWeight: "800", lineHeight: 22, marginBottom: 4 }}>
                      {recipient?.full_name ?? "Employee"}
                    </Text>

                    {shift ? (
                      <Text style={{ color: "rgba(13,27,62,0.45)", fontSize: 15, marginBottom: 12 }}>
                        {formatRole(shift.role_at_time_of_shift)}
                        {"  ·  "}
                        {formatShiftDate(shift.start_time)}
                        {"  "}
                        {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                      </Text>
                    ) : (
                      <Text style={{ color: "rgba(13,27,62,0.25)", fontSize: 13, marginBottom: 12 }}>
                        Loading shift…
                      </Text>
                    )}

                    {swap.status === "PENDING" && (
                      <Pressable onPress={() => { setWithdrawTarget(swap); setWithdrawError(null); }}>
                        <Text style={{ color: "#D32F2F", fontSize: 13, fontWeight: "700" }}>
                          Withdraw request
                        </Text>
                      </Pressable>
                    )}
                    {swap.status === "APPROVED" && (
                      <Text style={{ color: "#05CC66", fontSize: 13, fontWeight: "700" }}>
                        ✓ Manager approved this swap
                      </Text>
                    )}
                    {swap.status === "DENIED" && (
                      <View>
                        <Text style={{ color: "#D32F2F", fontSize: 13, fontWeight: "700" }}>
                          Manager denied this swap
                        </Text>
                        {(swap as any).deny_reason ? (
                          <Text style={{ color: "rgba(13,27,62,0.45)", fontSize: 12, marginTop: 4 }}>
                            Reason: {(swap as any).deny_reason}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <ConfirmWithdrawModal
        visible={!!withdrawTarget}
        onCancel={() => { setWithdrawTarget(null); setWithdrawError(null); }}
        onConfirm={handleWithdrawConfirm}
        error={withdrawError}
        loading={withdrawing}
      />
    </View>
  );
}