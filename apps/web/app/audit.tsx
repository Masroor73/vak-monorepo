import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import ManagerLayout from "./layouts/ManagerLayout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useAuthGuard } from "../hooks/useAuthGuard";
import type { Profile } from "@vak/contract";

type AuditStatus = "PENDING" | "APPROVED" | "FLAGGED";
type AuditFilter = "ALL" | AuditStatus;

type ShiftRow = {
  id: string;
  employee_id: string;
  manager_id: string;
  start_time: string;
  end_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  clock_in_lat: number | null;
  clock_in_long: number | null;
  clock_out_lat: number | null;
  clock_out_long: number | null;
  location_id: string | null;
  status: string | null;
  unpaid_break_minutes: number | null;
  is_holiday: boolean | null;
  role_at_time_of_shift: string;
  clock_in_photo_url: string | null;
  clock_out_photo_url: string | null;
  audit_status: string;
};

type AuditRow = ShiftRow & {
  employeeName: string;
  avatar: string;
  auditStatus: AuditStatus;
  varianceMinutes: number | null;
  varianceTone: "warning" | "danger" | "neutral";
  varianceLabel: string;
};

function parseValidDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfCalendarGrid(date: Date) {
  const monthStart = startOfMonth(date);
  const day = monthStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const d = new Date(monthStart);
  d.setDate(monthStart.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(value: string) {
  const parsed = parseValidDate(value);
  if (!parsed) return "Invalid date";

  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  const parsed = parseValidDate(value);
  if (!parsed) return "—";

  return parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRole(role?: string | null) {
  if (!role) return "Shift";
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAuditStatus(value?: string | null): AuditStatus {
  if (value === "APPROVED") return "APPROVED";
  if (value === "FLAGGED") return "FLAGGED";
  return "PENDING";
}

function getStatusClasses(status: AuditStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700";
    case "FLAGGED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function getVarianceMinutes(start: string, actualStart: string | null) {
  const scheduled = parseValidDate(start);
  const actual = parseValidDate(actualStart);

  if (!scheduled || !actual) return null;

  const diffMs = actual.getTime() - scheduled.getTime();
  return Math.round(diffMs / 60000);
}

function formatVariance(minutes: number | null) {
  if (minutes === null) return "—";
  if (minutes === 0) return "On time";

  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);

  if (abs >= 60) {
    const hrs = Math.floor(abs / 60);
    const mins = abs % 60;
    return `${sign}${hrs}h ${mins}m`;
  }

  return `${sign}${abs} min`;
}

function endedEarly(endTime: string, actualEndTime: string | null) {
  const scheduledEnd = parseValidDate(endTime);
  const actualEnd = parseValidDate(actualEndTime);

  if (!scheduledEnd || !actualEnd) return false;

  return scheduledEnd.getTime() - actualEnd.getTime() > 0;
}

function getVarianceTone(
  shift: ShiftRow,
  varianceMinutes: number | null
): "warning" | "danger" | "neutral" {
  if (endedEarly(shift.end_time, shift.actual_end_time)) {
    return "danger";
  }

  if (varianceMinutes === null || varianceMinutes === 0) return "neutral";
  if (varianceMinutes < 0) return "neutral";
  return "warning";
}

function getVarianceLabel(shift: ShiftRow) {
  if (endedEarly(shift.end_time, shift.actual_end_time)) {
    return "Left early";
  }

  return "Variance";
}

function getVarianceClasses(tone: "warning" | "danger" | "neutral") {
  switch (tone) {
    case "danger":
      return "text-red-600";
    case "warning":
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
}

function formatDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayKeyFromValue(value?: string | null) {
  const parsed = parseValidDate(value);
  if (!parsed) return null;
  return formatDayKey(parsed);
}

function isSameDay(a: Date, b: Date) {
  return formatDayKey(a) === formatDayKey(b);
}

function SummaryCard({
  value,
  label,
  tone = "default",
  active = false,
  onClick,
}: {
  value: number;
  label: string;
  tone?: "default" | "warning" | "success" | "danger";
  active?: boolean;
  onClick: () => void;
}) {
  const valueClass =
    tone === "warning"
      ? "text-yellow-600"
      : tone === "success"
      ? "text-green-600"
      : tone === "danger"
      ? "text-red-600"
      : "text-gray-900";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-lg border p-4 text-left transition hover:shadow-sm ${
        active ? "ring-2 ring-black border-black" : "border-gray-200"
      }`}
    >
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </button>
  );
}

function PhotoModal({
  open,
  title,
  imageUrl,
  onClose,
}: {
  open: boolean;
  title: string;
  imageUrl: string | null;
  onClose: () => void;
}) {
  if (!open || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="p-4">
          <div className="flex max-h-[75vh] items-center justify-center overflow-auto rounded-lg border bg-gray-50 p-2">
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[70vh] w-auto max-w-full rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  useAuthGuard();

  const router = useRouter();
  const { isManager, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<AuditFilter>("ALL");
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalTitle, setPhotoModalTitle] = useState("");
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  const monthStart = useMemo(() => startOfMonth(visibleMonth), [visibleMonth]);
  const monthEnd = useMemo(() => endOfMonth(visibleMonth), [visibleMonth]);

  const calendarDays = useMemo(() => {
    const start = startOfCalendarGrid(visibleMonth);
    return Array.from({ length: 42 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [visibleMonth]);

  const fetchShifts = useCallback(async () => {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .gte("start_time", monthStart.toISOString())
      .lt("start_time", monthEnd.toISOString())
      .not("actual_start_time", "is", null)
      .order("start_time", { ascending: true });

    if (!error && data) {
      setShifts(data as ShiftRow[]);
    }
  }, [monthStart, monthEnd]);

  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (!error && data) {
      setProfiles(data as Profile[]);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchShifts(), fetchProfiles()]);
    } finally {
      setLoading(false);
    }
  }, [fetchShifts, fetchProfiles]);

  useEffect(() => {
    if (authLoading) return;

    if (!isManager) {
      router.replace("/");
      return;
    }

    fetchData();

    const channel = supabase
      .channel("audit-page-calendar")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shifts",
        },
        () => {
          fetchShifts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, isManager, router, fetchData, fetchShifts]);

  async function updateAuditStatus(id: string, status: AuditStatus) {
    setSavingId(id);

    try {
      const { error } = await supabase
        .from("shifts")
        .update({ audit_status: status })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setShifts((prev) =>
        prev.map((shift) =>
          shift.id === id ? { ...shift, audit_status: status } : shift
        )
      );
    } catch (error) {
      console.error("Failed to update audit status:", error);
    } finally {
      setSavingId(null);
    }
  }

  function openPhoto(title: string, url: string | null) {
    if (!url) return;
    setPhotoModalTitle(title);
    setPhotoModalUrl(url);
    setPhotoModalOpen(true);
  }

  function closePhoto() {
    setPhotoModalOpen(false);
    setPhotoModalTitle("");
    setPhotoModalUrl(null);
  }

  const profileMap = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles.forEach((profile) => {
      map.set(profile.id, profile);
    });
    return map;
  }, [profiles]);

  const auditRows = useMemo<AuditRow[]>(() => {
    return shifts.map((shift) => {
      const profile = profileMap.get(shift.employee_id);
      const employeeName = profile?.full_name ?? "Unknown User";
      const auditStatus = getAuditStatus(shift.audit_status);
      const varianceMinutes = getVarianceMinutes(
        shift.start_time,
        shift.actual_start_time
      );
      const varianceTone = getVarianceTone(shift, varianceMinutes);
      const varianceLabel = getVarianceLabel(shift);

      return {
        ...shift,
        employeeName,
        avatar: getInitials(employeeName),
        auditStatus,
        varianceMinutes,
        varianceTone,
        varianceLabel,
      };
    });
  }, [shifts, profileMap]);

  const filteredRows = useMemo(() => {
    if (activeFilter === "ALL") return auditRows;
    return auditRows.filter((row) => row.auditStatus === activeFilter);
  }, [auditRows, activeFilter]);

  const totals = useMemo(() => {
    return {
      total: auditRows.length,
      pending: auditRows.filter((row) => row.auditStatus === "PENDING").length,
      approved: auditRows.filter((row) => row.auditStatus === "APPROVED").length,
      flagged: auditRows.filter((row) => row.auditStatus === "FLAGGED").length,
    };
  }, [auditRows]);

  const dayBuckets = useMemo(() => {
    const map = new Map<string, AuditRow[]>();

    filteredRows.forEach((row) => {
      const key = getDayKeyFromValue(row.start_time);
      if (!key) return;

      const existing = map.get(key) ?? [];
      existing.push(row);
      map.set(key, existing);
    });

    return map;
  }, [filteredRows]);

  const selectedDayKey = useMemo(() => formatDayKey(selectedDate), [selectedDate]);

  const selectedDayRows = useMemo(() => {
    return dayBuckets.get(selectedDayKey) ?? [];
  }, [dayBuckets, selectedDayKey]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Clock-In Audit</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review audit records by calendar day so managers can spot issues faster
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Showing audit records for {formatMonthLabel(visibleMonth)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            value={totals.total}
            label="Total"
            active={activeFilter === "ALL"}
            onClick={() => setActiveFilter("ALL")}
          />
          <SummaryCard
            value={totals.pending}
            label="Pending"
            tone="warning"
            active={activeFilter === "PENDING"}
            onClick={() => setActiveFilter("PENDING")}
          />
          <SummaryCard
            value={totals.approved}
            label="Approved"
            tone="success"
            active={activeFilter === "APPROVED"}
            onClick={() => setActiveFilter("APPROVED")}
          />
          <SummaryCard
            value={totals.flagged}
            label="Flagged"
            tone="danger"
            active={activeFilter === "FLAGGED"}
            onClick={() => setActiveFilter("FLAGGED")}
          />
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {formatMonthLabel(visibleMonth)}
              </div>
              <div className="text-sm text-gray-500">
                Click a day to review and manage its clock-ins
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    new Date(
                      visibleMonth.getFullYear(),
                      visibleMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setVisibleMonth(startOfMonth(today));
                  setSelectedDate(today);
                }}
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    new Date(
                      visibleMonth.getFullYear(),
                      visibleMonth.getMonth() + 1,
                      1
                    )
                  )
                }
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b bg-gray-50">
            {weekDays.map((day) => (
              <div
                key={day}
                className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-sm text-gray-500">Loading calendar...</div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayKey = formatDayKey(day);
                const rows = dayBuckets.get(dayKey) ?? [];
                const pendingCount = rows.filter(
                  (row) => row.auditStatus === "PENDING"
                ).length;
                const approvedCount = rows.filter(
                  (row) => row.auditStatus === "APPROVED"
                ).length;
                const flaggedCount = rows.filter(
                  (row) => row.auditStatus === "FLAGGED"
                ).length;
                const inMonth = day.getMonth() === visibleMonth.getMonth();
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[130px] border-b border-r p-3 text-left align-top transition hover:bg-gray-50 ${
                      inMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                    } ${isSelected ? "ring-2 ring-inset ring-black" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday ? "bg-black text-white" : "text-gray-900"
                        }`}
                      >
                        {day.getDate()}
                      </span>

                      {rows.length > 0 && (
                        <span className="text-xs font-medium text-gray-500">
                          {rows.length} audit{rows.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {pendingCount > 0 && (
                        <div className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                          {pendingCount} pending
                        </div>
                      )}

                      {approvedCount > 0 && (
                        <div className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          {approvedCount} approved
                        </div>
                      )}

                      {flaggedCount > 0 && (
                        <div className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          {flaggedCount} flagged
                        </div>
                      )}

                      {rows.slice(0, 2).map((row) => (
                        <div
                          key={row.id}
                          className="truncate rounded border border-gray-200 px-2 py-1 text-xs text-gray-700"
                        >
                          {row.employeeName} • {formatTime(row.actual_start_time)}
                        </div>
                      ))}

                      {rows.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{rows.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="border-b px-4 py-4">
            <div className="text-lg font-semibold text-gray-900">
              {formatShortDate(selectedDate)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {selectedDayRows.length} audit record
              {selectedDayRows.length === 1 ? "" : "s"} for this day
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-gray-500">Loading records...</div>
          ) : selectedDayRows.length === 0 ? (
            <div className="p-8 text-sm text-gray-500">
              No audit records match this day and filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Employee</th>
                    <th className="px-4 py-3 font-medium">Clock in</th>
                    <th className="px-4 py-3 font-medium">Shift start</th>
                    <th className="px-4 py-3 font-medium">Clock out</th>
                    <th className="px-4 py-3 font-medium">Variance</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Photos</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedDayRows.map((audit) => (
                    <tr key={audit.id} className="border-t align-top">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                            {audit.avatar}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {audit.employeeName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(audit.start_time)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-900">
                        {formatTime(audit.actual_start_time)}
                      </td>

                      <td className="px-4 py-4 text-gray-900">
                        {formatTime(audit.start_time)}
                      </td>

                      <td className="px-4 py-4 text-gray-900">
                        {formatTime(audit.actual_end_time)}
                      </td>

                      <td className="px-4 py-4">
                        <div
                          className={`font-medium ${getVarianceClasses(
                            audit.varianceTone
                          )}`}
                        >
                          {formatVariance(audit.varianceMinutes)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {audit.varianceLabel}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {formatRole(audit.role_at_time_of_shift)}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {audit.location_id ?? "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                            audit.auditStatus
                          )}`}
                        >
                          {audit.auditStatus.charAt(0) +
                            audit.auditStatus.slice(1).toLowerCase()}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openPhoto(
                                `${audit.employeeName} - Clock-in photo`,
                                audit.clock_in_photo_url
                              )
                            }
                            disabled={!audit.clock_in_photo_url}
                            className="rounded border px-3 py-2 text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            View In Photo
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openPhoto(
                                `${audit.employeeName} - Clock-out photo`,
                                audit.clock_out_photo_url
                              )
                            }
                            disabled={!audit.clock_out_photo_url}
                            className="rounded border px-3 py-2 text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            View Out Photo
                          </button>

                          <div className="text-xs text-gray-500">
                            GPS:{" "}
                            {audit.clock_in_lat !== null &&
                            audit.clock_in_long !== null
                              ? `${audit.clock_in_lat}, ${audit.clock_in_long}`
                              : "No GPS recorded"}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              updateAuditStatus(audit.id, "APPROVED")
                            }
                            disabled={savingId === audit.id}
                            className="rounded border px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              updateAuditStatus(audit.id, "FLAGGED")
                            }
                            disabled={savingId === audit.id}
                            className="rounded border px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-50"
                          >
                            Flag
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PhotoModal
        open={photoModalOpen}
        title={photoModalTitle}
        imageUrl={photoModalUrl}
        onClose={closePhoto}
      />
    </ManagerLayout>
  );
}