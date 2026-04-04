import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSwapSent?: () => void;
  shiftId: string;
  shiftStartTime: string;
  shiftEndTime: string;
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
  employee_name?: string;
  employee_avatar?: string | null;
  type: "shift";
};

type AvailableEmployee = {
  id: string;
  employee_id: string;
  full_name: string;
  avatar_url?: string | null;
  start_time: string;
  end_time: string;
  type: "available";
};

type SwapOption = EligibleShift | AvailableEmployee;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(timeStr: string) {
  if (timeStr.includes("T")) {
    return new Date(timeStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatRole(role: string) {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

function getShiftSwapError(shiftStartTime: string, shiftEndTime: string): string | null {
  const now = new Date();
  const start = new Date(shiftStartTime);
  const end = new Date(shiftEndTime);

  if (end < now) {
    return "This shift has already ended and cannot be swapped.";
  }

  if (start < now && end > now) {
    return "This shift is currently in progress and cannot be swapped.";
  }

  if (start < now) {
    return "This shift has already passed and cannot be swapped.";
  }

  return null;
}

const AVATAR_COLORS = ["#62CCEF", "#05CC66", "#FBC02D", "#D32F2F", "#7C3AED", "#EA580C"];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function InlineError({ message }: { message: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 24, marginBottom: 12 }}>
      <Ionicons name="alert-circle-outline" size={14} color="#D32F2F" />
      <Text style={{ color: "#ef4444", fontSize: 13, flex: 1 }}>{message}</Text>
    </View>
  );
}

function InlineSuccess({ message }: { message: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 24, marginBottom: 12 }}>
      <Ionicons name="checkmark-circle-outline" size={14} color="#05CC66" />
      <Text style={{ color: "#05CC66", fontSize: 13, flex: 1 }}>{message}</Text>
    </View>
  );
}

export default function SwapModal({ visible, onClose, onSwapSent, shiftId, shiftStartTime, shiftEndTime, role }: Props) {
  const { user } = useAuth();

  const [options, setOptions] = useState<SwapOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<SwapOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"shifts" | "available">("shifts");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadOptions();
    } else {
      setOptions([]);
      setSelectedOption(null);
      setTab("shifts");
      setLoadError(null);
      setSendError(null);
      setSendSuccess(null);
    }
  }, [visible, role, user?.id]);

  async function loadOptions() {
    if (!user || !role) return;

    const swapError = getShiftSwapError(shiftStartTime, shiftEndTime);
    if (swapError) {
      setLoadError(swapError);
      return;
    }

    setLoadError(null);
    setLoading(true);

    try {
      const { data: shifts, error: shiftError } = await supabase
        .from("shifts")
        .select("*, profiles!shifts_employee_id_fkey(full_name, avatar_url)")
        .eq("role_at_time_of_shift", role)
        .neq("employee_id", user.id)
        .gt("start_time", shiftStartTime)
        .neq("status", "COMPLETED")
        .order("start_time", { ascending: true });

      if (shiftError) {
        console.log("SHIFT ERROR:", JSON.stringify(shiftError));
        setLoadError("Failed to load eligible shifts.");
        return;
      }

      const shiftDate = new Date(shiftStartTime).toISOString().split("T")[0];

      const { data: available, error: availError } = await supabase
        .from("availabilities")
        .select("*, profiles(full_name, avatar_url)")
        .eq("specific_date", shiftDate)
        .eq("is_available", true)
        .neq("user_id", user.id);

      if (availError) {
        console.log("AVAIL ERROR:", JSON.stringify(availError));
      }

      const shiftOptions: EligibleShift[] = (shifts || []).map((s: any) => ({
        ...s,
        employee_name: s.profiles?.full_name ?? "Employee",
        employee_avatar: s.profiles?.avatar_url ?? null,
        type: "shift" as const,
      }));

      const availOptions: AvailableEmployee[] = (available || []).map((a: any) => ({
        id: a.id,
        employee_id: a.user_id,
        full_name: a.profiles?.full_name ?? "Employee",
        avatar_url: a.profiles?.avatar_url ?? null,
        start_time: a.start_time,
        end_time: a.end_time,
        type: "available" as const,
      }));

      setOptions([...shiftOptions, ...availOptions]);
    } catch (e) {
      console.log("LOAD ERROR:", e);
      setLoadError("Failed to load options. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendSwapRequest() {
    if (!selectedOption || !user) {
      setSendError("Please choose a shift or employee first.");
      return;
    }

    const swapError = getShiftSwapError(shiftStartTime, shiftEndTime);
    if (swapError) {
      setSendError(swapError);
      return;
    }

    setSendError(null);
    setSendSuccess(null);

    try {
      setSending(true);

      const { data: existing } = await supabase
        .from("shift_swaps")
        .select("id")
        .eq("requester_id", user.id)
        .eq("shift_id", shiftId)
        .eq("status", "PENDING")
        .maybeSingle();

      if (existing) {
        setSendError("You already have a pending swap request for this shift.");
        return;
      }

      const recipientId = selectedOption.employee_id;

      const { error } = await supabase.from("shift_swaps").insert([
        {
          requester_id: user.id,
          recipient_id: recipientId,
          shift_id: shiftId,
          status: "PENDING",
          reason: "Shift swap request",
        },
      ]);

      if (error) {
        setSendError("Failed to send swap request. Please try again.");
        return;
      }

      await supabase.from("notifications").insert([
        {
          user_id: user.id,
          type: "SHIFT_SWAP",
          title: "Shift Swap Request",
          message: "🟡 Your shift swap request is PENDING",
          is_read: false,
          related_entity_id: shiftId,
        },
        {
          user_id: recipientId,
          type: "SHIFT_SWAP",
          title: "Shift Swap Request",
          message: "🔔 Someone requested to swap shifts with you",
          is_read: false,
          related_entity_id: shiftId,
        },
      ]);

      setSendSuccess("Swap request sent successfully!");
      setSelectedOption(null);
      onSwapSent?.();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setSendError("Failed to send swap request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const shiftOptions = options.filter((o) => o.type === "shift") as EligibleShift[];
  const availOptions = options.filter((o) => o.type === "available") as AvailableEmployee[];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      {/* Full screen container */}
      <View style={{ flex: 1, justifyContent: "flex-end" }}>

        {/* ── Backdrop ── */}
        <Pressable
          onPress={onClose}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)" }}
        />

        {/* ── Sheet — fixed 80% height, flex column so footer stays at bottom ── */}
        <View style={{
          height: "80%",
          backgroundColor: "#fff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          flexDirection: "column",
        }}>

          {/* ── Handle bar ── */}
          <View style={{ width: 32, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8 }} />

          {/* ── Header ── */}
          <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ color: "#0d1b3e", fontSize: 20, fontWeight: "800" }}>Request Shift Swap</Text>
              <Pressable
                onPress={onClose}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="close" size={18} color="#0d1b3e" />
              </Pressable>
            </View>
            <Text style={{ color: "#9ca3af", fontSize: 12 }}>Pick someone to swap with below</Text>
          </View>

          {/* ── Load error ── */}
          {loadError && <InlineError message={loadError} />}

          {/* ── Tabs ── */}
          <View style={{ flexDirection: "row", marginHorizontal: 24, marginBottom: 16, backgroundColor: "#f3f4f6", borderRadius: 12, padding: 4 }}>
            {(["shifts", "available"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: tab === t ? "#0d1b3e" : "transparent",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: tab === t ? "#fff" : "#9ca3af" }}>
                  {t === "shifts" ? `Shifts (${shiftOptions.length})` : `Available (${availOptions.length})`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── List — flex: 1 so it takes remaining space between tabs and footer ── */}
          {loading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color="#0d1b3e" />
              <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 12 }}>Loading options…</Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {tab === "shifts" && (
                <>
                  {shiftOptions.length === 0 ? (
                    <View style={{ paddingVertical: 40, alignItems: "center" }}>
                      <Ionicons name="calendar-outline" size={36} color="#d1d5db" />
                      <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 12 }}>No eligible shifts found</Text>
                    </View>
                  ) : (
                    shiftOptions.map((shift) => {
                      const selected = selectedOption?.id === shift.id;
                      const color = avatarColor(shift.employee_id);
                      const initials = getInitials(shift.employee_name ?? "E");
                      return (
                        <Pressable
                          key={shift.id}
                          onPress={() => { setSelectedOption(selected ? null : shift); setSendError(null); }}
                          style={{
                            marginBottom: 12,
                            borderRadius: 16,
                            borderWidth: 1.5,
                            borderColor: selected ? "#0d1b3e" : "#e5e7eb",
                            backgroundColor: selected ? "rgba(13,27,62,0.04)" : "#fff",
                            shadowColor: "#0d1b3e",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        >
                          {selected && <View style={{ height: 3, backgroundColor: "#0d1b3e", borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />}
                          <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View style={{
                              width: 44, height: 44, borderRadius: 22,
                              backgroundColor: color + "22",
                              borderWidth: 1.5, borderColor: color + "55",
                              alignItems: "center", justifyContent: "center"
                            }}>
                              <Text style={{ color, fontSize: 14, fontWeight: "700" }}>{initials}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: "#0d1b3e", fontWeight: "700", fontSize: 14 }}>{shift.employee_name}</Text>
                              <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{formatRole(shift.role_at_time_of_shift)}</Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                                <Ionicons name="calendar-outline" size={11} color="#9ca3af" />
                                <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                                  {formatDate(shift.start_time)}{"  "}{formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                                </Text>
                              </View>
                            </View>
                            {selected ? (
                              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#0d1b3e", alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="checkmark" size={14} color="#fff" />
                              </View>
                            ) : (
                              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: "#d1d5db" }} />
                            )}
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </>
              )}

              {tab === "available" && (
                <>
                  {availOptions.length === 0 ? (
                    <View style={{ paddingVertical: 40, alignItems: "center" }}>
                      <Ionicons name="people-outline" size={36} color="#d1d5db" />
                      <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 12 }}>No available employees found</Text>
                    </View>
                  ) : (
                    availOptions.map((emp) => {
                      const selected = selectedOption?.id === emp.id;
                      const color = avatarColor(emp.employee_id);
                      const initials = getInitials(emp.full_name);
                      return (
                        <Pressable
                          key={emp.id}
                          onPress={() => { setSelectedOption(selected ? null : emp); setSendError(null); }}
                          style={{
                            marginBottom: 12,
                            borderRadius: 16,
                            borderWidth: 1.5,
                            borderColor: selected ? "#05CC66" : "#e5e7eb",
                            backgroundColor: selected ? "rgba(5,204,102,0.04)" : "#fff",
                            shadowColor: "#0d1b3e",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        >
                          {selected && <View style={{ height: 3, backgroundColor: "#05CC66", borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />}
                          <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View style={{
                              width: 44, height: 44, borderRadius: 22,
                              backgroundColor: color + "22",
                              borderWidth: 1.5, borderColor: color + "55",
                              alignItems: "center", justifyContent: "center"
                            }}>
                              <Text style={{ color, fontSize: 14, fontWeight: "700" }}>{initials}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: "#0d1b3e", fontWeight: "700", fontSize: 14 }}>{emp.full_name}</Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#05CC66" }} />
                                <Text style={{ color: "#05CC66", fontSize: 12, fontWeight: "600" }}>Available</Text>
                              </View>
                              <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                                {formatTime(emp.start_time)} – {formatTime(emp.end_time)}
                              </Text>
                            </View>
                            {selected ? (
                              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#05CC66", alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="checkmark" size={14} color="#fff" />
                              </View>
                            ) : (
                              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: "#d1d5db" }} />
                            )}
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </>
              )}
            </ScrollView>
          )}

          {/* ── Send error / success ── */}
          {sendError && <InlineError message={sendError} />}
          {sendSuccess && <InlineSuccess message={sendSuccess} />}

          {/* ── Footer — always at bottom ── */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
            <Pressable
              onPress={sendSwapRequest}
              disabled={!selectedOption || sending}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                backgroundColor: !selectedOption || sending ? "#f3f4f6" : "#0d1b3e",
              }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#0d1b3e" />
              ) : (
                <Ionicons
                  name="swap-horizontal-outline"
                  size={18}
                  color={!selectedOption ? "#9ca3af" : "#fff"}
                />
              )}
              <Text style={{
                fontWeight: "700",
                fontSize: 13,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: !selectedOption || sending ? "#9ca3af" : "#fff",
              }}>
                {sending ? "Sending…" : "Send Swap Request"}
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}