import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, RefreshControl, Pressable, Modal, TouchableOpacity, StatusBar, Dimensions,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ── Types ────────────────────────────────────────────────────────────────────
type Session = {
  id: string;
  session_type: string;
  clock_in_time: string;
  clock_out_time: string | null;
  clock_in_photo_url: string | null;
  clock_out_photo_url: string | null;
  clock_in_lat: number | null;
  clock_in_long: number | null;
};

type ShiftWithSessions = {
  id: string;
  start_time: string;
  end_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  status: string | null;
  role_at_time_of_shift: string;
  sessions: Session[];
};

type PhotoViewerState = {
  visible: boolean;
  uri: string | null;
  label: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "In progress";
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  const totalMins = Math.floor(diffMs / 60000);
  if (totalMins < 1) return "< 1m";
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hrs === 0 ? `${mins}m` : `${hrs}h ${mins}m`;
}

function calcTotalWorked(sessions: Session[]): string {
  const workMs = sessions
    .filter((s) => s.session_type === "WORK" && s.clock_out_time)
    .reduce(
      (acc, s) =>
        acc + (new Date(s.clock_out_time!).getTime() - new Date(s.clock_in_time).getTime()),
      0
    );
  const totalMins = Math.floor(workMs / 60000);
  if (totalMins === 0) return "0m";
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hrs === 0 ? `${mins}m` : `${hrs}h ${mins}m`;
}

function formatShortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatShiftDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
  });
}

// ── Photo Thumbnail ──────────────────────────────────────────────────────────
function PhotoThumb({ uri, label, onPress }: { uri: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="items-center gap-1">
      <View className="w-20 h-20 rounded overflow-hidden border-2 border-gray-200">
        <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
        <View className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 items-center">
          <Ionicons name="expand-outline" size={11} color="#fff" />
        </View>
      </View>
      <Text className="text-[10px] text-gray-400 font-semibold tracking-wider">{label}</Text>
    </TouchableOpacity>
  );
}

// ── Fullscreen Photo Viewer ──────────────────────────────────────────────────
function PhotoViewer({ state, onClose }: { state: PhotoViewerState; onClose: () => void }) {
  return (
    <Modal
      visible={state.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/95 justify-center items-center">
        <StatusBar barStyle="light-content" />

        {/* Top bar */}
        <View className="absolute top-14 left-0 right-0 flex-row items-center justify-between px-5 z-10">
          <View className="bg-white/10 rounded-full px-4 py-2">
            <Text className="text-white text-[13px] font-semibold">{state.label}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-white/15 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Full photo — Dimensions unavoidable here for exact screen fill */}
        {state.uri && (
          <Image
            source={{ uri: state.uri }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.25 }}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );
}

// ── Session Row ──────────────────────────────────────────────────────────────
function SessionRow({
  session,
  isLast,
  workIndex,
  onPhotoPress,
}: {
  session: Session;
  isLast: boolean;
  workIndex: number;
  onPhotoPress: (uri: string, label: string) => void;
}) {
  const isBreak = session.session_type === "BREAK";
  const duration = formatDuration(session.clock_in_time, session.clock_out_time);
  const sessionLabel = isBreak ? "Break" : `Session ${workIndex}`;

  return (
    <View className={`flex-row ${isLast ? "" : "mb-4"}`}>

      {/* Timeline spine */}
      <View className="w-8 items-center">
        <View
          className={`w-12 h-12 rounded-full items-center justify-center z-10 border-2
            ${isBreak
              ? "bg-amber-50 border-amber-400"
              : "bg-blue-50 border-brand-secondary"
            }`}
        >
          <Ionicons
            name={isBreak ? "cafe-outline" : "briefcase-outline"}
            size={20}
            color={isBreak ? "#F59E0B" : "#0d1b3e"}
          />
        </View>
        {!isLast && <View className="w-0.5 flex-1 mt-1 bg-gray-300" />}
      </View>

      {/* Content */}
      <View className={`flex-1 ml-3 ${isLast ? "" : "pb-1"}`}>

        {/* Label + duration pill */}
        <View className="flex-row justify-between items-center mb-1.5">
          <Text className="text-[15px] font-bold text-gray-800">{sessionLabel}</Text>
          <View
            className={`rounded-full px-3 py-0.5 border
              ${isBreak
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
              }`}
          >
            <Text
              className={`text-[13px] font-bold
                ${isBreak ? "text-amber-600" : "text-brand-secondaryLight"}`}
            >
              {duration}
            </Text>
          </View>
        </View>

        {/* In / Out times */}
        <View className="flex-row items-center gap-2 mb-3">
          <View className="flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <Text className="text-[13px] text-gray-500">{formatShortTime(session.clock_in_time)}</Text>
          </View>

          {session.clock_out_time ? (
            <>
              <Ionicons name="arrow-forward" size={10} color="gray" />
              <View className="flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <Text className="text-[12px] text-gray-500">{formatShortTime(session.clock_out_time)}</Text>
              </View>
            </>
          ) : (
            <View className="flex-row items-center gap-1.5 bg-green-50 rounded-full px-2 py-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <Text className="text-[11px] text-green-700 font-semibold">Active</Text>
            </View>
          )}
        </View>

        {/* Photos */}
        {(session.clock_in_photo_url || session.clock_out_photo_url) && (
          <View className="flex-row gap-3">
            {session.clock_in_photo_url && (
              <PhotoThumb
                uri={session.clock_in_photo_url}
                label="CLOCK IN"
                onPress={() => onPhotoPress(session.clock_in_photo_url!, `${sessionLabel} · Clock In`)}
              />
            )}
            {session.clock_out_photo_url && (
              <PhotoThumb
                uri={session.clock_out_photo_url}
                label="CLOCK OUT"
                onPress={() => onPhotoPress(session.clock_out_photo_url!, `${sessionLabel} · Clock Out`)}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Shift Card ───────────────────────────────────────────────────────────────
function ShiftCard({
  shift,
  onPhotoPress,
}: {
  shift: ShiftWithSessions;
  onPhotoPress: (uri: string, label: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalWorked = calcTotalWorked(shift.sessions);
  const workSessions = shift.sessions.filter((s) => s.session_type === "WORK");
  const breakSessions = shift.sessions.filter((s) => s.session_type === "BREAK");
  let workCounter = 0;

  const stats = [
    { label: "WORKED", value: totalWorked },
    { label: "SESSIONS", value: String(workSessions.length) },
    { label: "BREAKS", value: String(breakSessions.length) },
  ];

  return (
    <View className="bg-white rounded-3xl mb-4 overflow-hidden shadow-sm">

      {/* Header */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="bg-brand-secondary px-5 py-4"
      >
        {/* Role + date + chevron */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <Text className="text-white font-extrabold text-[15px] tracking-wide uppercase">
              {shift.role_at_time_of_shift?.replace(/_/g, " ")}
            </Text>
            <Text className="text-brand-primary text-[13px] font-medium mt-1">
              {formatShiftDate(shift.start_time)}
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={17}
            color="rgba(255,255,255,0.45)"
          />
        </View>

        {/* Stats strip */}
        <View className="flex-row bg-white/10 rounded-lg overflow-hidden h-20">
          {stats.map((stat, i) => (
            <View
              key={i}
              className={`flex-1 items-center py-2.5 ${i < 2 ? "border-r border-white/10" : ""}`}
            >
              <Text className="text-white font-extrabold text-[16px] pt-3">{stat.value}</Text>
              <Text className="text-white/50 text-[9px] tracking-widest mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>
      </Pressable>

      {/* Sessions timeline */}
      {expanded && (
        <View className="p-4">
          {shift.sessions.length === 0 ? (
            <Text className="text-gray-400 text-[13px] text-center py-3">
              No session data recorded.
            </Text>
          ) : (
            shift.sessions.map((session, idx) => {
              if (session.session_type === "WORK") workCounter++;
              return (
                <SessionRow
                  key={session.id}
                  session={session}
                  isLast={idx === shift.sessions.length - 1}
                  workIndex={workCounter}
                  onPhotoPress={onPhotoPress}
                />
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function ClockHistoryScreen() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<ShiftWithSessions[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoViewer, setPhotoViewer] = useState<PhotoViewerState>({
    visible: false, uri: null, label: "",
  });

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  async function loadHistory() {
    setLoading(true);

    const { data: shiftData, error: shiftError } = await supabase
      .from("shifts")
      .select("*")
      .eq("employee_id", user?.id)
      .not("actual_start_time", "is", null)
      .order("actual_start_time", { ascending: false });

    if (shiftError || !shiftData) { setLoading(false); return; }

    const shiftIds = shiftData.map((s) => s.id);
    const { data: sessionData } = await supabase
      .from("shift_sessions")
      .select("*")
      .in("shift_id", shiftIds)
      .order("clock_in_time", { ascending: true });

    const sessionsByShift: Record<string, Session[]> = {};
    (sessionData || []).forEach((s) => {
      if (!sessionsByShift[s.shift_id]) sessionsByShift[s.shift_id] = [];
      sessionsByShift[s.shift_id].push(s);
    });

    setShifts(shiftData.map((shift) => ({ ...shift, sessions: sessionsByShift[shift.id] || [] })));
    setLoading(false);
  }

  const openPhoto = (uri: string, label: string) =>
    setPhotoViewer({ visible: true, uri, label });

  const closePhoto = () =>
    setPhotoViewer({ visible: false, uri: null, label: "" });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0d1b3e" />
        <Text className="mt-3 text-gray-400 text-[13px] font-medium">Loading history...</Text>
      </View>
    );
  }

  return (
    <>
      <PhotoViewer state={photoViewer} onClose={closePhoto} />

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadHistory} tintColor="#0d1b3e" />
        }
      >
        {/* Summary pill */}
        <View className="flex-row items-center bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4 gap-3">
          <View className="w-9 h-9 rounded-full bg-brand-secondary items-center justify-center">
            <Ionicons name="time-outline" size={18} color="#62CCEF" />
          </View>
          <View>
            <Text className="text-[15px] font-bold text-brand-secondary">
              {shifts.length} shift{shifts.length !== 1 ? "s" : ""} recorded
            </Text>
            <Text className="text-[11px] text-gray-400 mt-0.5">Tap any photo to view full size</Text>
          </View>
        </View>

        {/* Empty state */}
        {shifts.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-2">
              <Ionicons name="time-outline" size={36} color="#0d1b3e" />
            </View>
            <Text className="text-[18px] font-extrabold text-gray-800">No history yet</Text>
            <Text className="text-gray-400 text-[14px] text-center">
              Your clock-in records will appear here.
            </Text>
          </View>
        ) : (
          shifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} onPhotoPress={openPhoto} />
          ))
        )}
      </ScrollView>
    </>
  );
}
