import { useEffect, useMemo, useState } from "react";
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

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-US", {
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

function getAccentClasses(status: AuditStatus) {
  switch (status) {
    case "APPROVED":
      return "border-l-4 border-l-green-500";
    case "FLAGGED":
      return "border-l-4 border-l-red-500";
    default:
      return "border-l-4 border-l-transparent";
  }
}

function getVarianceMinutes(start: string, actualStart: string | null) {
  if (!actualStart) return null;
  const diffMs =
    new Date(actualStart).getTime() - new Date(start).getTime();
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

function getVarianceTone(
  shift: ShiftRow,
  varianceMinutes: number | null
): "warning" | "danger" | "neutral" {
  if (shift.actual_end_time) {
    const remainingMs =
      new Date(shift.end_time).getTime() - new Date(shift.actual_end_time).getTime();

    if (remainingMs > 0) {
      return "danger";
    }
  }

  if (varianceMinutes === null || varianceMinutes === 0) return "neutral";
  if (varianceMinutes < 0) return "neutral";
  return "warning";
}

function getVarianceLabel(shift: ShiftRow) {
  if (shift.actual_end_time) {
    const remainingMs =
      new Date(shift.end_time).getTime() - new Date(shift.actual_end_time).getTime();

    if (remainingMs > 0) return "Left early";
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

function getGpsClasses(flagged: boolean, hasGps: boolean) {
  if (!hasGps) return "bg-gray-50 border border-gray-200 text-gray-500";
  if (flagged) return "bg-red-50 border border-red-200 text-red-700";
  return "bg-blue-50 border border-blue-200 text-blue-700";
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

function PhotoBox({
  label,
  url,
  timestamp,
  emptyText,
}: {
  label: string;
  url?: string | null;
  timestamp?: string | null;
  emptyText: string;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>

      <div className="relative h-36 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-gray-300">{emptyText}</span>
        )}

        {timestamp && (
          <div className="absolute bottom-2 left-2 rounded bg-gray-700 px-2 py-1 text-xs font-medium text-white">
            {formatTime(timestamp)}
          </div>
        )}
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

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  useEffect(() => {
    if (authLoading) return;

    if (!isManager) {
      router.replace("/");
      return;
    }

    fetchData();

    const channel = supabase
      .channel("audit-page-shifts")
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
  }, [authLoading, isManager]);

  async function fetchData() {
    setLoading(true);
    await Promise.all([fetchShifts(), fetchProfiles()]);
    setLoading(false);
  }

  async function fetchShifts() {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .gte("start_time", weekStart.toISOString())
      .lt("start_time", weekEnd.toISOString())
      .not("actual_start_time", "is", null)
      .order("start_time", { ascending: true });

    if (!error && data) {
      setShifts(data as ShiftRow[]);
    }
  }

  async function fetchProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (!error && data) {
      setProfiles(data as Profile[]);
    }
  }

  async function updateAuditStatus(id: string, status: AuditStatus) {
    setSavingId(id);

    const { error } = await supabase
      .from("shifts")
      .update({ audit_status: status })
      .eq("id", id);

    if (!error) {
      setShifts((prev) =>
        prev.map((shift) =>
          shift.id === id ? { ...shift, audit_status: status } : shift
        )
      );
    }

    setSavingId(null);
  }

  const profileMap = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles.forEach((profile) => {
      map.set(profile.id, profile);
    });
    return map;
  }, [profiles]);

  const auditCards = useMemo(() => {
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

  const totals = useMemo(() => {
    return {
      total: auditCards.length,
      pending: auditCards.filter((card) => card.auditStatus === "PENDING").length,
      approved: auditCards.filter((card) => card.auditStatus === "APPROVED").length,
      flagged: auditCards.filter((card) => card.auditStatus === "FLAGGED").length,
    };
  }, [auditCards]);

  const filteredCards = useMemo(() => {
    if (activeFilter === "ALL") return auditCards;
    return auditCards.filter((card) => card.auditStatus === activeFilter);
  }, [auditCards, activeFilter]);

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Clock-In Audit</h1>
          <p className="text-gray-500 text-sm mt-1">
            Approve or flag each shift before running payroll
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

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg border p-8 text-sm text-gray-500">
              Loading audit records...
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-sm text-gray-500">
              No audit records match this filter.
            </div>
          ) : (
            filteredCards.map((audit) => {
              const hasClockInGps =
                audit.clock_in_lat !== null && audit.clock_in_long !== null;
              const isFlagged = audit.auditStatus === "FLAGGED";

              return (
                <div
                  key={audit.id}
                  className={`bg-white rounded-lg border overflow-hidden ${getAccentClasses(
                    audit.auditStatus
                  )}`}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 text-white text-sm font-bold flex items-center justify-center">
                        {audit.avatar}
                      </div>

                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {audit.employeeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(audit.start_time)}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                        audit.auditStatus
                      )}`}
                    >
                      {audit.auditStatus.charAt(0) +
                        audit.auditStatus.slice(1).toLowerCase()}
                    </span>
                  </div>

                  <div className="grid gap-6 px-6 py-4 lg:grid-cols-[1.2fr_0.9fr]">
                    <div className="space-y-4">
                      <PhotoBox
                        label="Clock-in photo"
                        url={audit.clock_in_photo_url}
                        timestamp={audit.actual_start_time}
                        emptyText="No clock-in photo"
                      />

                      <PhotoBox
                        label="Clock-out photo"
                        url={audit.clock_out_photo_url}
                        timestamp={audit.actual_end_time}
                        emptyText="Not clocked out yet"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Clock in</div>
                          <div className="mt-1 text-2xl font-bold text-gray-900">
                            {formatTime(audit.actual_start_time)}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500">Shift start</div>
                          <div className="mt-1 text-2xl font-bold text-gray-900">
                            {formatTime(audit.start_time)}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500">Clock out</div>
                          <div className="mt-1 text-2xl font-bold text-gray-900">
                            {formatTime(audit.actual_end_time)}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500">
                            {audit.varianceLabel}
                          </div>
                          <div
                            className={`mt-1 text-xl font-semibold ${getVarianceClasses(
                              audit.varianceTone
                            )}`}
                          >
                            {formatVariance(audit.varianceMinutes)}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500">
                        Role:{" "}
                        <span className="font-medium text-gray-800">
                          {formatRole(audit.role_at_time_of_shift)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500">
                        Location:{" "}
                        <span className="font-medium text-gray-800">
                          {audit.location_id ?? "—"}
                        </span>
                      </div>

                      <div
                        className={`rounded-lg px-4 py-3 text-sm ${getGpsClasses(
                          isFlagged,
                          hasClockInGps
                        )}`}
                      >
                        <div className="font-medium">
                          {isFlagged ? "GPS issue" : "GPS at clock-in"}
                        </div>
                        <div className="mt-1">
                          {hasClockInGps
                            ? `${audit.clock_in_lat}, ${audit.clock_in_long}`
                            : "No GPS recorded"}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => updateAuditStatus(audit.id, "APPROVED")}
                          disabled={savingId === audit.id}
                          className="border rounded px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => updateAuditStatus(audit.id, "FLAGGED")}
                          disabled={savingId === audit.id}
                          className="border rounded px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          Flag
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}