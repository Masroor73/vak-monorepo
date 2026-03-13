// web/app/(components)/AssignShiftModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Profile, JobRoleEnum } from "@vak/contract";
import { supabase } from "../../lib/supabase";

export interface Availability {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

interface Props {
  weekDays: Date[];
  availableEmployees: Profile[];
  availabilities: Availability[];
  prefillEmployee?: Profile | null;
  prefillDate?: string;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignShiftModal({
  weekDays,
  availableEmployees,
  availabilities,
  prefillEmployee,
  prefillDate,
  currentUserId,
  onClose,
  onSuccess,
}: Props) {
  const [employeeId, setEmployeeId] = useState(prefillEmployee?.id ?? "");
  const [date, setDate]             = useState(prefillDate ?? formatDate(weekDays[0]));
  const [startTime, setStartTime]   = useState("09:00");
  const [endTime, setEndTime]       = useState("17:00");
  const [role, setRole]             = useState<typeof JobRoleEnum._type>(JobRoleEnum.options[0]);
  const [locationId, setLocationId] = useState("damascus-hq");
  const [breakMins, setBreakMins]   = useState(0);
  const [isHoliday, setIsHoliday]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const selectedDow = new Date(date + "T00:00:00").getDay();

  const eligibleEmployees = useMemo(() =>
    availableEmployees.filter((emp) =>
      availabilities.some(
        (a) => a.user_id === emp.id && a.day_of_week === selectedDow && a.is_available
      )
    ),
    [availableEmployees, availabilities, selectedDow]
  );

  useEffect(() => {
    if (employeeId && !eligibleEmployees.find((e) => e.id === employeeId)) {
      setEmployeeId("");
    }
  }, [eligibleEmployees]);

  const handleSubmit = async () => {
    if (!employeeId)            { setError("Please select an employee."); return; }
    if (!date)                  { setError("Please select a date."); return; }
    if (!startTime || !endTime) { setError("Please set start and end times."); return; }

    setSaving(true);
    setError(null);

    const { error: err } = await supabase.from("shifts").insert({
      employee_id:           employeeId,
      manager_id:            currentUserId,
      start_time:            new Date(`${date}T${startTime}:00`).toISOString(),
      end_time:              new Date(`${date}T${endTime}:00`).toISOString(),
      role_at_time_of_shift: role,
      location_id:           locationId || "damascus-hq",
      unpaid_break_minutes:  breakMins,
      is_holiday:            isHoliday,
      status:                "PUBLISHED",
    });

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Assign Shift</h2>
            <p className="text-sm text-gray-400">Schedule a new shift for an employee</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Employee */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Employee
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Select an employee…</option>
            {eligibleEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name ?? emp.email}
              </option>
            ))}
          </select>
          {eligibleEmployees.length === 0 && (
            <p className="text-xs text-auth-pending mt-1">
              No employees have marked availability for this day.
            </p>
          )}
        </div>

        {/* Date + Role */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Date
            </label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Role at Shift
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof JobRoleEnum._type)}
            >
              {JobRoleEnum.options.map((r) => (
                <option key={r} value={r}>{formatRole(r)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start + End */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              End Time
            </label>
            <input
              type="time"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Location + Break */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Location ID
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Unpaid Break (mins)
            </label>
            <input
              type="number"
              min={0}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={breakMins}
              onChange={(e) => setBreakMins(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Public Holiday toggle */}
        <div className="flex items-center justify-between border rounded-xl px-4 py-3 bg-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-800">Public Holiday</p>
            <p className="text-xs text-gray-400">Mark this shift as a holiday shift</p>
          </div>
          <button
            onClick={() => setIsHoliday((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors relative ${isHoliday ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isHoliday ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Assign Shift"}
          </button>
        </div>

      </div>
    </div>
  );
}