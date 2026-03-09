import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabase, useEmployees } from "@vak/api";
import { JobRoleEnum, ShiftSchema } from "@vak/contract";

type Props = {
  open: boolean;
  onClose: () => void;

  managerId?: string;

 
  onCreated?: () => void;
};

function toIsoFromDatetimeLocal(value: string) {

  const d = new Date(value);
  return d.toISOString();
}

export default function CreateShiftModal({
  open,
  onClose,
  managerId,
  onCreated,
}: Props) {
  const qc = useQueryClient();
  const { data: employees = [], isLoading: employeesLoading, error: employeesError } =
    useEmployees();

  const roleOptions = useMemo(() => JobRoleEnum.options, []);

  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState<(typeof JobRoleEnum.options)[number] | "">("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [isHoliday, setIsHoliday] = useState(false);
  const [locationId, setLocationId] = useState("damascus-hq");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    try {
      setSubmitting(true);

      const supabase = getSupabase();

      let resolvedManagerId = managerId;
      if (!resolvedManagerId) {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        resolvedManagerId = data.user?.id ?? undefined;
      }
      if (!resolvedManagerId) {
        setFormError("You must be signed in as a manager to create a shift.");
        return;
      }

      if (!employeeId) {
        setFormError("Please select an employee.");
        return;
      }
      if (!role) {
        setFormError("Please select a role.");
        return;
      }
      if (!startLocal || !endLocal) {
        setFormError("Please select start and end time.");
        return;
      }

      const payload = {
        employee_id: employeeId,
        manager_id: resolvedManagerId,
        start_time: toIsoFromDatetimeLocal(startLocal),
        end_time: toIsoFromDatetimeLocal(endLocal),

        role_at_time_of_shift: role,
        location_id: locationId,

        unpaid_break_minutes: breakMinutes,
        is_holiday: isHoliday,

      };

      const parsed = ShiftSchema.safeParse(payload);
      if (!parsed.success) {
        const msg = parsed.error.issues?.[0]?.message ?? "Invalid shift data.";
        setFormError(msg);
        return;
      }

      const { error: insertError } = await supabase.from("shifts").insert(parsed.data);
      if (insertError) {
        setFormError(insertError.message);
        return;
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["shifts"] }),
        qc.invalidateQueries({ queryKey: ["schedule"] }),
      ]);

      onCreated?.();
      onClose();
    } catch (err: any) {
      setFormError(err?.message ?? "Something went wrong creating the shift.");
    } finally {
      setSubmitting(false);
      
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Create Shift</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Employee */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Employee</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={employeesLoading || submitting}
            >
              <option value="">Select employee…</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name ?? emp.email ?? emp.id}
                </option>
              ))}
            </select>
            {employeesError ? (
              <p className="text-sm text-red-600">Failed to load employees.</p>
            ) : null}
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Role</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              disabled={submitting}
            >
              <option value="">Select role…</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Start time</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">End time</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Extras */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Unpaid break (minutes)</label>
              <input
                type="number"
                min={0}
                step={1}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value || 0))}
                disabled={submitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Location</label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isHoliday}
              onChange={(e) => setIsHoliday(e.target.checked)}
              disabled={submitting}
            />
            Mark as holiday
          </label>

          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Create Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}