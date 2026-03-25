// web/app/(components)/ViewShiftModal.tsx
import { useState } from "react";
import { Profile, JobRoleEnum } from "@vak/contract";
import { supabase } from "../../lib/supabase";

export type ShiftStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "VOID" | "PARTIAL";

export interface Shift {
  id: string;
  employee_id: string;
  manager_id: string;
  start_time: string;
  end_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  clock_in_lat: number | null;
  clock_in_long: number | null;
  location_id: string | null;
  status: ShiftStatus | null;
  unpaid_break_minutes: number | null;
  is_holiday: boolean | null;
  role_at_time_of_shift: string;
  created_at: string;
}

export const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-blue-50 text-blue-600 border border-blue-200",
  COMPLETED: "bg-green-50 text-green-700 border border-green-200",
  VOID:      "bg-red-50 text-red-500 border border-red-200",
  PARTIAL:   "bg-orange-50 text-orange-600 border border-orange-200",
};

// Fix #5 — PARTIAL added to normalizeStatus
function normalizeStatus(status: ShiftStatus | null): "PUBLISHED" | "COMPLETED" | "VOID" | "PARTIAL" {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "VOID")      return "VOID";
  if (status === "PARTIAL")   return "PARTIAL";
  return "PUBLISHED"; // covers PUBLISHED, DRAFT, null
}

function toTimeInput(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ");
}

// Fix #5 — PARTIAL and COMPLETED treated as past (fully locked)
function getShiftTiming(shift: Shift): "past" | "in_progress" | "future" {
  if (shift.status === "COMPLETED" || shift.status === "PARTIAL") return "past";
  const now = new Date();
  const start = new Date(shift.start_time);
  const end = new Date(shift.end_time);
  if (now >= end)                return "past";
  if (now >= start && now < end) return "in_progress";
  return "future";
}

interface Props {
  shift: Shift;
  employee: Profile | undefined;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ViewShiftModal({ shift, employee, onClose, onSuccess }: Props) {

  const [status, setStatus] = useState<"PUBLISHED" | "COMPLETED" | "VOID" | "PARTIAL">(normalizeStatus(shift.status));
  const [isEditing, setIsEditing]       = useState(false);
  const [editDate, setEditDate]         = useState(shift.start_time.split("T")[0]);
  const [editStart, setEditStart]       = useState(toTimeInput(shift.start_time));
  const [editEnd, setEditEnd]           = useState(toTimeInput(shift.end_time));
  const [editRole, setEditRole]         = useState(shift.role_at_time_of_shift);
  const [editLocation, setEditLocation] = useState(shift.location_id ?? "damascus-hq");
  const [editBreak, setEditBreak]       = useState(shift.unpaid_break_minutes ?? 0);
  const [editHoliday, setEditHoliday]   = useState(shift.is_holiday ?? false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const timing = getShiftTiming(shift);

  const editDisabledReason =
    timing === "past"        ? "Cannot edit a shift that has already ended." :
    timing === "in_progress" ? "Cannot edit a shift that is currently in progress." :
    null;

  // Fix #1 — in_progress now also blocks delete
  const deleteDisabledReason =
    timing === "past"        ? "Cannot delete a shift that has already ended." :
    timing === "in_progress" ? "Cannot delete a shift that is currently in progress." :
    null;

  // Fix #3 — status change guarded by timing
  const statusChangeDisabledReason =
    timing === "past"        ? "Cannot change the status of a shift that has already ended." :
    timing === "in_progress" ? "Cannot change the status of a shift that is currently in progress." :
    null;

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES["PUBLISHED"];
  const statusLabel = status.charAt(0) + status.slice(1).toLowerCase();

  // Fix #3 — guard added before persisting status change
  const handleStatusChange = async (newStatus: "PUBLISHED" | "VOID") => {
    if (statusChangeDisabledReason) { setError(statusChangeDisabledReason); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("shifts").update({ status: newStatus }).eq("id", shift.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setStatus(newStatus);
    onSuccess?.();
  };

  // Fix #4 — validate against actual current datetime, not midnight
  const handleSaveEdit = async () => {
    if (!editStart || !editEnd) { setError("Please set start and end times."); return; }
    if (editStart >= editEnd)   { setError("End time must be after start time."); return; }

    const now = new Date();
    const proposedStart = new Date(`${editDate}T${editStart}:00`);
    if (proposedStart <= now) { setError("Start time must be in the future."); return; }

    setSaving(true); setError(null);
    const { error: err } = await supabase.from("shifts").update({
      start_time:            proposedStart.toISOString(),
      end_time:              new Date(`${editDate}T${editEnd}:00`).toISOString(),
      role_at_time_of_shift: editRole,
      location_id:           editLocation || "damascus-hq",
      unpaid_break_minutes:  editBreak,
      is_holiday:            editHoliday,
    }).eq("id", shift.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setIsEditing(false);
    onSuccess?.();
  };

  // Fix #2 — restore swap request denial + employee notification before deleting
  const handleDelete = async () => {
    setSaving(true); setError(null);

    // Step 1: Deny any open swap requests tied to this shift
    const { error: swapErr } = await supabase
      .from("shift_swap_requests")
      .update({ status: "DENIED" })
      .eq("shift_id", shift.id)
      .in("status", ["PENDING", "UNDER_REVIEW"]);

    if (swapErr) {
      setSaving(false);
      setError(`Failed to resolve swap requests: ${swapErr.message}`);
      return;
    }

    // Step 2: Notify the employee their shift was removed
    if (shift.employee_id) {
      await supabase.from("notifications").insert({
        user_id: shift.employee_id,
        type:    "SHIFT_DELETED",
        message: `Your shift on ${new Date(shift.start_time).toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric",
        })} (${toTimeInput(shift.start_time)} – ${toTimeInput(shift.end_time)}) has been removed by a manager.`,
        is_read: false,
      });
    }

    // Step 3: Delete the shift
    const { error: deleteErr } = await supabase.from("shifts").delete().eq("id", shift.id);
    setSaving(false);
    if (deleteErr) { setError(deleteErr.message); return; }
    onSuccess?.();
    onClose();
  };

  const rows: { label: string; value: string }[] = [
    { label: "Employee", value: employee?.full_name ?? employee?.email ?? "—" },
    { label: "Role",     value: formatRole(shift.role_at_time_of_shift) },
    {
      label: "Date",
      value: new Date(shift.start_time).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      }),
    },
    { label: "Start",    value: toTimeInput(shift.start_time) },
    { label: "End",      value: toTimeInput(shift.end_time) },
    { label: "Break",    value: shift.unpaid_break_minutes != null ? `${shift.unpaid_break_minutes} mins` : "0 mins" },
    { label: "Location", value: shift.location_id ?? "damascus-hq" },
    { label: "Holiday",  value: shift.is_holiday ? "Yes" : "No" },
    ...(shift.actual_start_time ? [{ label: "Clock In",  value: toTimeInput(shift.actual_start_time) }] : []),
    ...(shift.actual_end_time   ? [{ label: "Clock Out", value: toTimeInput(shift.actual_end_time) }]   : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? "Edit Shift" : "Shift Details"}
            </h2>
            <span className={`mt-1 inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
            ✕
          </button>
        </div>

        {/* Fix #3 — status dropdown replaced with locked message when timing blocks it */}
        {!isEditing && status !== "COMPLETED" && status !== "PARTIAL" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Change Status
            </label>
            {statusChangeDisabledReason ? (
              <div className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed">
                Status locked — {statusChangeDisabledReason.toLowerCase()}
              </div>
            ) : (
              <select
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                value={status}
                disabled={saving}
                onChange={(e) => handleStatusChange(e.target.value as "PUBLISHED" | "VOID")}
              >
                <option value="PUBLISHED">Published</option>
                <option value="VOID">Void</option>
              </select>
            )}
          </div>
        )}

        {/* View mode */}
        {!isEditing && (
          <div className="divide-y">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2.5 text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Edit mode */}
        {isEditing && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Start Time</label>
                <input type="time" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editStart} onChange={(e) => setEditStart(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">End Time</label>
                <input type="time" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Role at Shift</label>
              <select className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                {JobRoleEnum.options.map((r) => (
                  <option key={r} value={r}>{formatRole(r)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Location ID</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Break (mins)</label>
                <input type="number" min={0} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editBreak} onChange={(e) => setEditBreak(Number(e.target.value))} />
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-xl px-4 py-3 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">Public Holiday</p>
                <p className="text-xs text-gray-400">Mark this shift as a holiday shift</p>
              </div>
              <button
                onClick={() => setEditHoliday((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative ${editHoliday ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editHoliday ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-3">
            <p className="text-sm font-medium text-red-700">
              Are you sure you want to delete this shift? The employee will be notified and any open swap requests will be denied. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-red-700 transition disabled:opacity-50">
                {saving ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        {!confirmDelete && (
          <div className="pt-1">
            {isEditing ? (
              <div className="flex gap-3">
                <button onClick={() => { setIsEditing(false); setError(null); }} className="flex-1 border rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={saving} className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 border rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  Close
                </button>
                <button
                  onClick={() => {
                    if (editDisabledReason) { setError(editDisabledReason); return; }
                    setIsEditing(true); setError(null);
                  }}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    editDisabledReason
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
                >
                  Edit Shift
                </button>
                <button
                  onClick={() => {
                    if (deleteDisabledReason) { setError(deleteDisabledReason); return; }
                    setConfirmDelete(true);
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                    deleteDisabledReason
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-red-200 text-red-500 hover:bg-red-50"
                  }`}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
