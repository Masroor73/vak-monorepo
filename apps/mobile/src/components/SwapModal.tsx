import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator, TextInput } from "react-native";
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
  shift_date: string;
  type: "available";
};

type SwapOption = EligibleShift | AvailableEmployee;

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
  if (end < now) return "This shift has already ended and cannot be swapped.";
  if (start < now && end > now) return "This shift is currently in progress and cannot be swapped.";
  if (start < now) return "This shift has already passed and cannot be swapped.";
  return null;
}

function timeStrToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function availabilityCoversShift(
  availStart: string,
  availEnd: string,
  shiftStart: string,
  shiftEnd: string
): boolean {
  const availStartMins = timeStrToMinutes(availStart);
  const availEndMins = timeStrToMinutes(availEnd);
  const shiftStartMins = timeStrToMinutes(new Date(shiftStart).toTimeString().slice(0, 5));
  const shiftEndMins = timeStrToMinutes(new Date(shiftEnd).toTimeString().slice(0, 5));
  return availStartMins <= shiftStartMins && availEndMins >= shiftEndMins;
}

function InlineError({ message }: { message: string }) {
  return (
    <View className="flex-row items-start gap-x-2.5 bg-red-50 border-l-[3px] border-red-500 rounded-xl px-3.5 py-5 mx-5 mb-3">
      <Ionicons name="alert-circle" size={25} color="#ef4444" style={{ marginTop: 5 }} />
      <Text className="text-red-700 text-[15px] flex-1 leading-[18px]">{message}</Text>
    </View>
  );
}

function InlineSuccess({ message }: { message: string }) {
  return (
    <View className="flex-row items-center gap-x-2.5 bg-green-50 border-l-[3px] border-green-500 rounded-xl px-3.5 py-3 mx-5 mb-3">
      <Ionicons name="checkmark-circle" size={15} color="#05CC66" />
      <Text className="text-green-700 text-[13px] flex-1">{message}</Text>
    </View>
  );
}

export default function SwapModal({
  visible,
  onClose,
  onSwapSent,
  shiftId,
  shiftStartTime,
  shiftEndTime,
  role,
}: Props) {
  const { user } = useAuth();

  const [options, setOptions] = useState<SwapOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<SwapOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"shifts" | "available">("shifts");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [timeBasedError, setTimeBasedError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

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
      setReason("");
    }
  }, [visible, role, user?.id]);

  useEffect(() => {
    if (!visible) {
      setTimeBasedError(null);
      return;
    }
    setTimeBasedError(getShiftSwapError(shiftStartTime, shiftEndTime));
    const id = setInterval(() => {
      setTimeBasedError(getShiftSwapError(shiftStartTime, shiftEndTime));
    }, 1000);
    return () => clearInterval(id);
  }, [visible, shiftStartTime, shiftEndTime]);

  async function loadOptions() { 
  if (!user) return;

  const swapError = getShiftSwapError(shiftStartTime, shiftEndTime);
  if (swapError) {
    setLoadError(swapError);
    return;
  }

  setLoadError(null);
  setLoading(true);

  const myShiftDate = new Date(shiftStartTime).toISOString().split("T")[0];
  const myStart = new Date(shiftStartTime).toTimeString().slice(0, 5);
  const myEnd = new Date(shiftEndTime).toTimeString().slice(0, 5);

  try {
    // Fetch all upcoming shifts excluding the current user
    const { data: shifts, error: shiftError } = await supabase
      .from("shifts")
      .select("*, profiles!shifts_employee_id_fkey(full_name, avatar_url)")
      .neq("employee_id", user.id)
      .gt("start_time", new Date().toISOString())
      .neq("status", "COMPLETED")
      .order("start_time", { ascending: true });

    if (shiftError) {
      setLoadError("Failed to load eligible shifts.");
      return;
    }

    // Deduplicate shifts per employee
    const seenShiftIds = new Set<string>();

    const shiftOptions: EligibleShift[] = (shifts || [])
      .filter((s: any) => {
        const shiftDate = new Date(s.start_time).toISOString().split("T")[0];
        if (shiftDate === myShiftDate) return false; // skip same-day shifts
        return true;
      })
      .filter((s: any) => {
        if (seenShiftIds.has(s.id)) return false;
        seenShiftIds.add(s.id);
        return true;
      })
      .map((s: any) => ({
        ...s,
        employee_name: s.profiles?.full_name ?? "Employee",
        employee_avatar: s.profiles?.avatar_url ?? null,
        type: "shift" as const,
      }));

    // Employees with conflicting shifts
    const employeesWithConflictingShifts = new Set(
      (shifts || [])
        .filter((s: any) => {
          const sStart = new Date(s.start_time).getTime();
          const sEnd = new Date(s.end_time).getTime();
          const myStartTime = new Date(shiftStartTime).getTime();
          const myEndTime = new Date(shiftEndTime).getTime();
          return sStart < myEndTime && sEnd > myStartTime;
        })
        .map((s: any) => s.employee_id)
    );

    // Load availabilities (including yourself)
    const { data: available, error: availError } = await supabase
      .from("availabilities")
      .select("*, profiles(full_name, avatar_url)")
      .eq("is_available", true);

    if (availError) console.error("Failed to load availabilities:", availError.message);

    const seenAvail = new Set<string>();

    // Map all of user's future shifts to filter overlapping availability
    const { data: myShifts } = await supabase
      .from("shifts")
      .select("*")
      .eq("employee_id", user.id)
      .gt("start_time", new Date().toISOString())
      .neq("status", "COMPLETED");

    const availOptions: AvailableEmployee[] = (available || [])
      .filter((a: any) => {
        const availDate = a.specific_date ?? myShiftDate;
        const aStart = a.start_time.slice(0, 5);
        const aEnd = a.end_time.slice(0, 5);
        const today = new Date().toISOString().split("T")[0];

        // Exclude past dates and same-day slots
        if (availDate <= today) return false;
        if (availDate === myShiftDate) return false;

        // Must cover exact time slot
        if (aStart !== myStart || aEnd !== myEnd) return false;

        // Skip employees with conflicting shifts
        if (employeesWithConflictingShifts.has(a.user_id)) return false;

        // Skip if already in shiftOptions
        const alreadyInShifts = shiftOptions.some(
          (s) => s.employee_id === a.user_id && new Date(s.start_time).toISOString().split("T")[0] === availDate
        );
        if (alreadyInShifts) return false;

        // Deduplicate by employee + date
        const key = `${a.user_id}-${availDate}`;
        if (seenAvail.has(key)) return false;
        seenAvail.add(key);

        // --- NEW: Remove user's availability if overlapping a shift ---
        if (a.user_id === user.id && myShifts?.some(s => {
          const sStart = new Date(s.start_time);
          const sEnd = new Date(s.end_time);
          const aStartDate = new Date(`${availDate}T${a.start_time}`);
          const aEndDate = new Date(`${availDate}T${a.end_time}`);
          return aStartDate < sEnd && aEndDate > sStart; // overlap check
        })) return false;

        return true;
      })
      .map((a: any) => ({
        id: a.id,
        employee_id: a.user_id,
        full_name: a.user_id === user.id ? "Your Availability" : a.profiles?.full_name ?? "Employee",
        avatar_url: a.profiles?.avatar_url ?? null,
        start_time: a.start_time,
        end_time: a.end_time,
        shift_date: a.specific_date ?? myShiftDate,
        type: "available" as const,
      }));

    // Set final options
    setOptions([...shiftOptions, ...availOptions]);
  } catch (e) {
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

    if (!reason.trim()) {
      setSendError("Please enter a reason for the swap request.");
      return;
    }

    const swapError = getShiftSwapError(shiftStartTime, shiftEndTime);
    if (swapError) { setSendError(swapError); return; }

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

      const { error } = await supabase.from("shift_swaps").insert([{
        requester_id: user.id,
        recipient_id: recipientId,
        shift_id: shiftId,
        status: "PENDING",
        reason: reason.trim(),
        recipient_type: selectedOption.type,
      }]);

      if (error) {
        setSendError("Failed to send swap request. Please try again.");
        return;
      }

      await supabase.from("notifications").insert([{
        user_id: recipientId,
        type: "SHIFT_SWAP",
        title: "Shift Swap Request",
        message: "Someone requested to swap shifts with you",
        is_read: false,
        related_entity_id: shiftId,
      }]);

      setSendSuccess("Swap request sent successfully!");
      setSelectedOption(null);
      setReason("");
      onSwapSent?.();
      setTimeout(() => onClose(), 1200);
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
      <View className="flex-1 justify-end">

        {/* Backdrop */}
        <Pressable
          onPress={onClose}
          className="absolute top-0 left-0 right-0 bottom-0 bg-[rgba(5,10,30,0.65)]"
        />

        {/* Sheet */}
        <View className="h-[84%] bg-white rounded-tl-[32px] rounded-tr-[32px] flex-col overflow-hidden">

          {/* Header */}
          <View className="bg-white px-5 pt-[18px] pb-1.5">

            {/* Handle */}
            <View className="w-9 h-1 bg-slate-200 rounded self-center mb-[18px]" />

            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-[#0d1b3e] text-[22px] font-extrabold tracking-tight">
                  Request a Swap
                </Text>
                <Text className="text-slate-500 text-[13px] font-bold uppercase mt-2">
                  Pick a colleague below to swap with
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-[34px] h-[34px] rounded-full bg-slate-100 items-center justify-center border border-slate-200 mt-0.5"
              >
                <Ionicons name="close" size={17} color="#475569" />
              </Pressable>
            </View>

            {/* Tabs */}
            <View className="flex-row mt-5 border-b-[1.5px] border-slate-100">
              {(["shifts", "available"] as const).map((t) => {
                const active = tab === t;
                const count = t === "shifts" ? shiftOptions.length : availOptions.length;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTab(t)}
                    className={`flex-1 py-3 items-center flex-row justify-center gap-x-[7px] -mb-[1.5px] border-b-[2.5px] ${active ? "border-[#0d1b3e]" : "border-transparent"}`}
                  >
                    <Text className={`text-[14px] font-bold ${active ? "text-[#0d1b3e]" : "text-slate-500"}`}>
                      {t === "shifts" ? "Shifts" : "Available"}
                    </Text>
                    <View className={`min-w-[22px] h-5 rounded-[10px] px-1.5 items-center justify-center ${active ? "bg-[#0d1b3e]" : "bg-slate-100"}`}>
                      <Text className={`text-[11px] font-extrabold ${active ? "text-white" : "text-slate-400"}`}>
                        {count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {timeBasedError && (
            <View className="pt-3.5">
              <InlineError message={timeBasedError} />
            </View>
          )}

          {!timeBasedError && loadError && (
            <View className="pt-3.5">
              <InlineError message={loadError} />
            </View>
          )}

          {loading ? (
            <View className="flex-1 items-center justify-center gap-y-3">
              <ActivityIndicator size="large" color="#0d1b3e" />
              <Text className="text-slate-400 text-[13px] font-medium">Finding options…</Text>
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 pt-3.5 pb-2"
              showsVerticalScrollIndicator={false}
            >

              {/* ── SHIFTS TAB ──────────────────────────────────────────────── */}
              {tab === "shifts" && (
                <>
                  {shiftOptions.length === 0 ? (
                    <View className="py-12 items-center gap-y-2.5">
                      <View className="w-[60px] h-[60px] rounded-full bg-slate-50 items-center justify-center border border-slate-400 mb-3">
                        <Ionicons name="calendar-outline" size={26} color="gray" />
                      </View>
                      <Text className="text-gray-700 text-[20px] font-bold">No eligible shifts</Text>
                      <Text className="text-gray-400 text-[17px] text-center leading-[19px]">
                        No colleagues have an upcoming shift and availability covering your shift times
                      </Text>
                    </View>
                  ) : (
                    shiftOptions.map((shift) => {
                      const selected = selectedOption?.id === shift.id;
                      return (
                        <Pressable
                          key={shift.id}
                          onPress={() => { setSelectedOption(selected ? null : shift); setSendError(null); }}
                          className={`mb-2.5 rounded-2xl border-[1.5px] flex-row overflow-hidden ${selected ? "border-[#62CCEF] bg-[#e8f8fd]" : "border-[#eef0f4] bg-gray-50"}`}
                        >
                          <View className={`w-1 ${selected ? "bg-[#62CCEF]" : "bg-slate-300"}`} />
                          <View className="flex-1 p-4 flex-row items-center gap-x-3">
                            <View className="flex-1 gap-y-1">
                              <Text className="text-slate-900 font-bold text-[17px]">
                                {shift.employee_name}
                              </Text>
                              <Text className="text-slate-500 text-[14px]">
                                {formatRole(shift.role_at_time_of_shift)}
                              </Text>
                              <View className="flex-row items-center gap-x-1.5 mt-1 flex-wrap">
                                <View className={`rounded-[7px] px-2 py-1 flex-row items-center gap-x-1 ${selected ? "bg-white/20" : "bg-[#eef0f4]"}`}>
                                  <Ionicons name="calendar-outline" size={12} color="#64748b" />
                                  <Text className="text-slate-600 text-[13px] font-semibold">
                                    {formatDate(shift.start_time)}
                                  </Text>
                                </View>
                                <View className={`rounded-[7px] px-2 py-1 flex-row items-center gap-x-1 ${selected ? "bg-[#62CCEF]/20" : "bg-[#eef0f4]"}`}>
                                  <Ionicons name="time-outline" size={12} color="#64748b" />
                                  <Text className="text-slate-600 text-[13px] font-semibold">
                                    {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <View className={`w-[26px] h-[26px] rounded-full items-center justify-center border-2 ${selected ? "bg-[#62CCEF] border-[#62CCEF]" : "bg-white border-gray-300"}`}>
                              {selected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                            </View>
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </>
              )}

              {/* ── AVAILABLE TAB ───────────────────────────────────────────── */}
              {tab === "available" && (
                <>
                  {availOptions.length === 0 ? (
                    <View className="py-12 items-center gap-y-2.5">
                      <View className="w-[60px] h-[60px] rounded-full bg-slate-50 items-center justify-center border border-slate-400 mb-3">
                        <Ionicons name="people-outline" size={26} color="gray" />
                      </View>
                      <Text className="text-gray-700 text-[20px] font-bold">No available employees</Text>
                      <Text className="text-gray-400 text-[17px] text-center leading-[19px] px-5">
                        Nobody is available during your shift times on this date
                      </Text>
                    </View>
                  ) : (
                    availOptions.map((emp) => {
                      const selected = selectedOption?.id === emp.id;
                      return (
                        <Pressable
                          key={emp.id}
                          onPress={() => { setSelectedOption(selected ? null : emp); setSendError(null); }}
                          className={`mb-2.5 rounded-2xl border-[1.5px] flex-row overflow-hidden ${selected ? "border-[#62CCEF] bg-[#e8f8fd]" : "border-[#eef0f4] bg-gray-50"}`}
                        >
                          <View className={`w-1 ${selected ? "bg-[#62CCEF]" : "bg-slate-300"}`} />
                          <View className="flex-1 p-4 flex-row items-center gap-x-3">
                            <View className="flex-1 gap-y-1">
                              <Text className="text-slate-900 font-bold text-[17px]">
                                {emp.full_name}
                              </Text>
                              <View className="flex-row items-center gap-x-[5px]">
                                <View className="w-[7px] h-[7px] rounded-full bg-[#62CCEF]" />
                                <Text className="text-[#1a9bbf] text-[14px] font-semibold">Available</Text>
                              </View>
                              <View className="flex-row items-center gap-x-1.5 mt-1 flex-wrap">
                                <View className={`rounded-[7px] px-2 py-1 flex-row items-center gap-x-1 ${selected ? "bg-white/20" : "bg-[#eef0f4]"}`}>
                                  <Ionicons name="calendar-outline" size={12} color="#64748b" />
                                  <Text className="text-slate-600 text-[13px] font-semibold">
                                    {new Date(emp.shift_date + "T00:00:00").toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </Text>
                                </View>
                                <View className={`rounded-[7px] px-2 py-1 flex-row items-center gap-x-1 ${selected ? "bg-[#62CCEF]/20" : "bg-[#eef0f4]"}`}>
                                  <Ionicons name="time-outline" size={12} color="#64748b" />
                                  <Text className="text-slate-600 text-[13px] font-semibold">
                                    {formatTime(emp.start_time)} – {formatTime(emp.end_time)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <View className={`w-[26px] h-[26px] rounded-full items-center justify-center border-2 ${selected ? "bg-[#62CCEF] border-[#62CCEF]" : "bg-white border-gray-300"}`}>
                              {selected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                            </View>
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </>
              )}
            </ScrollView>
          )}

          {/* Send error / success */}
          {sendError && <InlineError message={sendError} />}
          {sendSuccess && <InlineSuccess message={sendSuccess} />}

          {/* Reason Input */}
          <View className="px-5 pb-3 pt-2 border-t border-slate-300 bg-white">
            <Text className="text-slate-700 text-[15px] font-bold uppercase tracking-wide mb-2">
              Reason <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={reason}
              onChangeText={(text) => { setReason(text); setSendError(null); }}
              placeholder="Why do you need to swap this shift?"
              placeholderTextColor="gray"
              multiline
              numberOfLines={3}
              maxLength={400}
              className="bg-gray border border-gray-400 rounded-2xl px-4 py-3 text-slate-800 text-[14px] leading-[20px]"
              style={{ textAlignVertical: "top", minHeight: 72 }}
            />
            <Text className="text-slate-600 text-[13px] text-right mt-1">{reason.length}/400</Text>
          </View>

          {/* Footer */}
          <View className="px-20 pb-[34px] pt-2 border-t border-slate-100 bg-white">
            <Pressable
              onPress={sendSwapRequest}
              disabled={!selectedOption || sending}
              className={`py-[17px] px-6 rounded-[18px] items-center justify-center ${!selectedOption || sending ? "bg-slate-300" : "bg-[#0d1b3e]"}`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#0d1b3e" />
              ) : (
                <Text className={`font-extrabold text-[13px] tracking-widest uppercase text-center ${!selectedOption ? "text-gray-500" : "text-white"}`}>
                  Send Swap Request
                </Text>
              )}
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}