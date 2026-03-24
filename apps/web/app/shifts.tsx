// web/app/shifts.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { Profile } from "@vak/contract";
import ManagerLayout from "./layouts/ManagerLayout";
import Ionicons from "@expo/vector-icons/Ionicons";
import AssignShiftModal, { Availability } from "./components/AssignShiftModal";
import ViewShiftModal, { Shift, STATUS_STYLES } from "./components/ViewShiftModal";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }).toUpperCase();
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// Fix #5 — PARTIAL now maps to its own orange style
function resolveStatusKey(status: Shift["status"]): "PUBLISHED" | "COMPLETED" | "VOID" | "PARTIAL" {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "VOID")      return "VOID";
  if (status === "PARTIAL")   return "PARTIAL";
  return "PUBLISHED"; // covers PUBLISHED, DRAFT, null
}

const AVATAR_COLORS = [
  "bg-blue-200 text-blue-800",
  "bg-green-200 text-green-800",
  "bg-orange-200 text-orange-800",
  "bg-purple-200 text-purple-800",
  "bg-pink-200 text-pink-800",
  "bg-teal-200 text-teal-800",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (const c of name) hash += c.charCodeAt(0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const LEGEND_ITEMS = [
  { label: "Published", className: "text-blue-500" },
  { label: "Completed", className: "text-green-600" },
  { label: "Partial",   className: "text-orange-500" },
  { label: "Void",      className: "text-red-500" },
];

export default function ShiftsPage() {
  useAuthGuard();
  const { profile: currentUser, isManager, loading: authLoading } = useAuth();
  const router = useRouter();

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const currentWeekStart = useMemo(() => getWeekStart(new Date()), []);
  const minWeek = useMemo(() => addDays(currentWeekStart, -42), [currentWeekStart]);
  const maxWeek = useMemo(() => addDays(currentWeekStart, 42), [currentWeekStart]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("All");
  const [showAssign, setShowAssign] = useState(false);
  const [prefillEmployee, setPrefillEmployee] = useState<Profile | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isManager) { router.replace("/"); return; }
    fetchData();
  }, [authLoading, isManager, weekStart]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchShifts(), fetchEmployees(), fetchAvailabilities()]);
    setLoading(false);
  };

  const fetchShifts = async () => {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .gte("start_time", weekStart.toISOString())
      .lt("start_time", addDays(weekStart, 7).toISOString());
    if (!error && data) setShifts(data as Shift[]);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_approved", true)
      .in("role", ["EMPLOYEE", "MANAGER"])
      .order("full_name", { ascending: true });
    if (!error && data) setEmployees(data as Profile[]);
  };

  const fetchAvailabilities = async () => {
    const { data, error } = await supabase
      .from("availabilities")
      .select("*")
      .eq("is_available", true)
      .not("specific_date", "is", null);
    if (!error && data) setAvailabilities(data as Availability[]);
  };

  const filteredEmployees = useMemo(
    () => employees.filter((emp) => filterRole === "All" || emp.role === filterRole),
    [employees, filterRole]
  );

  const getShiftForCell = (empId: string, date: Date): Shift | undefined =>
    shifts.find(
      (s) => s.employee_id === empId && formatDate(new Date(s.start_time)) === formatDate(date)
    );

  const openAssignModal = (emp?: Profile, date?: string) => {
    setPrefillEmployee(emp ?? null);
    setPrefillDate(date);
    setShowAssign(true);
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shift Schedule</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {formatWeekRange(weekStart)} · {shifts.length} shifts assigned this week
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="All">All</option>
              <option value="EMPLOYEE">Employees</option>
              <option value="MANAGER">Managers</option>
            </select>
            <button
              onClick={() => openAssignModal()}
              className="flex items-center gap-2 bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 transition"
            >
              <span className="text-base leading-none">+</span> Assign Shift
            </button>
          </div>
        </div>

        {/* Week navigator */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            disabled={weekStart <= minWeek}
            className="w-8 h-8 rounded-full bg-auth-blue flex items-center justify-center transition hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Ionicons name="chevron-back" size={16} color="white" />
          </button>
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
              {addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p className="text-xs text-gray-400">
              Click any shift to view · Click dashed cell to assign
            </p>
          </div>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            disabled={weekStart >= maxWeek}
            className="w-8 h-8 rounded-full bg-auth-blue flex items-center justify-center transition hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Ionicons name="chevron-forward" size={16} color="white" />
          </button>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl border overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">Loading shifts…</div>
          ) : (
            <table className="w-full text-sm min-w-[700px] border-collapse">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 w-44 border-r border-gray-200">Employee</th>
                  {weekDays.map((day, i) => {
                    const isToday = formatDate(day) === formatDate(new Date());
                    return (
                      <th
                        key={i}
                        className={`text-center px-2 py-3 font-medium text-xs tracking-wider border-r border-gray-200 last:border-r-0 ${isToday ? "text-blue-600 bg-blue-50/50" : "text-gray-500"}`}
                      >
                        {formatHeaderDate(day)}
                        {isToday && <span className="ml-1 text-blue-400">·</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-gray-400">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition border-b border-gray-200 last:border-b-0">

                      {/* Employee */}
                      <td className="px-5 py-3 border-r border-gray-200">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(emp.full_name ?? emp.email)}`}>
                            {getInitials(emp.full_name ?? emp.email)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 leading-tight">{emp.full_name ?? "—"}</p>
                            <p className="text-xs text-gray-400">{formatRole(emp.role)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Day cells */}
                      {weekDays.map((day, i) => {
                        const shift = getShiftForCell(emp.id, day);
                        const isAvailable = availabilities.some(
                          (a) => a.user_id === emp.id && a.specific_date === formatDate(day) && a.is_available
                        );
                        const isToday = formatDate(day) === formatDate(new Date());

                        return (
                          <td key={i} className={`px-2 py-3 text-center align-middle border-r border-gray-200 last:border-r-0 ${isToday ? "bg-blue-50/30" : ""}`}>
                            {shift ? (
                              <button
                                onClick={() => setViewingShift(shift)}
                                className={`w-full rounded-lg px-2 py-2 text-xs font-medium transition hover:opacity-75 ${STATUS_STYLES[resolveStatusKey(shift.status)]}`}
                              >
                                <div>{formatTime(shift.start_time)}</div>
                                <div>{formatTime(shift.end_time)}</div>
                              </button>
                            ) : isAvailable ? (
                              <button
                                onClick={() => openAssignModal(emp, formatDate(day))}
                                className="w-full h-12 rounded-lg border-2 border-dashed border-auth-pending text-auth-pending text-lg hover:bg-yellow-50 transition flex items-center justify-center"
                              >
                                +
                              </button>
                            ) : (
                              <div className="w-full h-12 flex items-center justify-center">
                                <span className="text-gray-200">—</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Legend — Fix #5: Partial added */}
        <div className="flex items-center gap-1 flex-wrap text-xs">
          <span className="font-semibold text-gray-500 mr-1">LEGEND:</span>
          {LEGEND_ITEMS.map(({ label, className }) => (
            <span key={label} className={`font-semibold ${className} mr-3`}>{label}</span>
          ))}
          <span className="text-gray-300">·</span>
          <span className="text-auth-pending font-bold ml-2">Dashed cell = available, no shift yet</span>
        </div>

      </div>

      {/* Modals */}
      {showAssign && currentUser && (
        <AssignShiftModal
          weekDays={weekDays}
          availableEmployees={employees}
          availabilities={availabilities}
          prefillEmployee={prefillEmployee}
          prefillDate={prefillDate}
          currentUserId={currentUser.id}
          onClose={() => setShowAssign(false)}
          onSuccess={fetchShifts}
        />
      )}
      {viewingShift && (
        <ViewShiftModal
          shift={viewingShift}
          employee={employees.find((e) => e.id === viewingShift.employee_id)}
          onClose={() => setViewingShift(null)}
          onSuccess={fetchShifts}
        />
      )}
    </ManagerLayout>
  );
}
