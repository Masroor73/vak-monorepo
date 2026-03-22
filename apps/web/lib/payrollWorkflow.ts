import type { PayrollReport, Shift as ApiShift } from "@vak/api";
import type { Shift as DbShift } from "../app/components/ViewShiftModal";
import type { Profile } from "@vak/contract";

/** Alberta-style UI: overtime hours paid at 1.5× regular rate (display only; engine returns hours). */
export const PAYROLL_OT_MULTIPLIER = 1.5;

export const PAYROLL_RUNS_STORAGE_KEY = "vak_payroll_runs_v1";

export function getPayrollApiBaseUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_PAYROLL_API_URL;
  if (typeof url === "string" && url.trim().length > 0) return url.replace(/\/$/, "");
  return undefined;
}

/** Monday-start week (matches Shift Management). */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDaysDate(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** True if the Monday–Sunday week overlaps the given calendar month (local). */
export function weekOverlapsCalendarMonth(
  weekMonday: Date,
  year: number,
  month1to12: number
): boolean {
  const ms = new Date(year, month1to12 - 1, 1).getTime();
  const me = new Date(year, month1to12, 0, 23, 59, 59, 999).getTime();
  const w0 = getWeekStart(weekMonday).getTime();
  const w1 = addDaysDate(getWeekStart(weekMonday), 7).getTime();
  return w0 <= me && w1 > ms;
}

/** All Monday starts for weeks that overlap the calendar month (typically 4–6). */
export function getMondaysOverlappingMonth(year: number, month1to12: number): Date[] {
  const ms = new Date(year, month1to12 - 1, 1);
  let m = getWeekStart(ms);
  for (let back = 0; back < 5; back++) {
    const prev = addDaysDate(m, -7);
    if (weekOverlapsCalendarMonth(prev, year, month1to12)) m = prev;
    else break;
  }
  const out: Date[] = [];
  for (let i = 0; i < 7; i++) {
    if (weekOverlapsCalendarMonth(m, year, month1to12)) {
      out.push(new Date(m));
    }
    m = addDaysDate(m, 7);
  }
  return out;
}

/** `weeks` is the number of Monday-start weeks included (1 or 2). */
export function formatPayrollPeriodRange(weekStart: Date, weeks: number = 1): string {
  const safeWeeks = Math.max(1, weeks);
  const end = addDaysDate(weekStart, 7 * safeWeeks - 1);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${weekStart.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

/**
 * Stable key for a Monday-start week — **local** calendar date (YYYY-MM-DD).
 * Using UTC (`toISOString().slice`) breaks alignment with `getWeekStart` in non-UTC zones.
 */
export function weekStartKey(weekStart: Date): string {
  const d = getWeekStart(weekStart);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a week key from `weekStartKey` back to a local noon Date (avoids DST edge cases). */
export function parseWeekKeyToLocalDate(key: string): Date {
  const parts = key.split("-");
  if (parts.length !== 3) return new Date(`${key}T12:00:00`);
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return new Date(`${key}T12:00:00`);
  }
  return new Date(y, mo - 1, d, 12, 0, 0, 0);
}

/** Label for payroll when multiple non-contiguous weeks are selected. */
export function formatSelectedWeeksLabel(sortedWeekStarts: Date[]): string {
  if (sortedWeekStarts.length === 0) return "";
  if (sortedWeekStarts.length === 1) return formatPayrollPeriodRange(sortedWeekStarts[0], 1);
  const parts = sortedWeekStarts.map((w) => formatPayrollPeriodRange(w, 1));
  if (parts.length <= 3) {
    return `${sortedWeekStarts.length} weeks: ${parts.join("; ")}`;
  }
  return `${sortedWeekStarts.length} weeks: ${parts.slice(0, 2).join("; ")}; …; ${parts[parts.length - 1]}`;
}

/** Returns true if shift scheduled start falls in [weekStart, weekStart+7d). */
export function shiftStartsInWeek(shift: DbShift, weekStart: Date): boolean {
  const ws = getWeekStart(weekStart).getTime();
  const we = addDaysDate(getWeekStart(weekStart), 7).getTime();
  const t = new Date(shift.start_time).getTime();
  return t >= ws && t < we;
}

export function filterShiftsToSelectedWeeks(
  shifts: DbShift[],
  selectedWeekStarts: Date[]
): DbShift[] {
  if (selectedWeekStarts.length === 0) return [];
  return shifts.filter((s) =>
    selectedWeekStarts.some((ws) => shiftStartsInWeek(s, ws))
  );
}

export type ExcludedShift = { shift: DbShift; reason: string };

export function partitionPayrollShifts(shifts: DbShift[]): {
  included: DbShift[];
  excluded: ExcludedShift[];
} {
  const included: DbShift[] = [];
  const excluded: ExcludedShift[] = [];

  for (const s of shifts) {
    const st = s.status ?? "DRAFT";
    if (st === "VOID") {
      excluded.push({ shift: s, reason: "Shift is void" });
      continue;
    }
    if (st === "DRAFT" || st === "PUBLISHED") {
      excluded.push({ shift: s, reason: "Shift not completed (pending clock audit)" });
      continue;
    }
    if (st !== "COMPLETED") {
      excluded.push({ shift: s, reason: "Shift not eligible for payroll" });
      continue;
    }
    if (!s.actual_start_time || !s.actual_end_time) {
      excluded.push({ shift: s, reason: "Missing clock-in or clock-out" });
      continue;
    }
    included.push(s);
  }
  return { included, excluded };
}

/** Maps DB shifts to API payload; engine reads start_time/end_time for duration — use actual times when present. */
export function toPayrollApiShifts(shifts: DbShift[]): ApiShift[] {
  return shifts.map((s) => {
    const start = s.actual_start_time ?? s.start_time;
    const end = s.actual_end_time ?? s.end_time;
    return {
      id: s.id,
      employee_id: s.employee_id,
      start_time: start,
      end_time: end,
      actual_start_time: s.actual_start_time,
      actual_end_time: s.actual_end_time,
      clock_in_lat: s.clock_in_lat,
      clock_in_long: s.clock_in_long,
      role_at_time_of_shift: s.role_at_time_of_shift,
      unpaid_break_minutes: s.unpaid_break_minutes ?? 0,
      is_holiday: s.is_holiday ?? false,
    };
  });
}

export type PayrollLine = {
  employeeId: string;
  employeeName: string;
  shiftCount: number;
  hourlyRate: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  grossPay: number;
};

export function countShiftsByEmployee(shifts: DbShift[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const s of shifts) {
    m[s.employee_id] = (m[s.employee_id] ?? 0) + 1;
  }
  return m;
}

export function buildPayrollLines(
  reports: PayrollReport[],
  employees: Profile[],
  shiftCounts: Record<string, number>
): PayrollLine[] {
  const byId = new Map(employees.map((e) => [e.id, e]));

  return reports.map((r) => {
    const id = r.employee_id ?? "";
    const profile = byId.get(id);
    const name = profile?.full_name?.trim() || profile?.email || id;
    const rate = profile?.hourly_rate ?? 0;
    const reg = r.regular_hours ?? 0;
    const ot = r.overtime_hours ?? 0;
    const gross = reg * rate + ot * rate * PAYROLL_OT_MULTIPLIER;

    return {
      employeeId: id,
      employeeName: name,
      shiftCount: shiftCounts[id] ?? 0,
      hourlyRate: rate,
      regularHours: reg,
      overtimeHours: ot,
      totalHours: r.total_hours ?? reg + ot,
      grossPay: Math.round(gross * 100) / 100,
    };
  });
}

export function sumGross(lines: PayrollLine[]): number {
  const t = lines.reduce((a, l) => a + l.grossPay, 0);
  return Math.round(t * 100) / 100;
}

export type PayrollRunRecord = {
  id: string;
  periodLabel: string;
  periodStartIso: string;
  periodEndIso: string;
  processedAtIso: string;
  processedById: string;
  processedByName: string;
  totalPayout: number;
  includedShiftCount: number;
  includedEmployeeCount: number;
  excludedCount: number;
  lines: PayrollLine[];
  excluded: { shiftId: string; employeeId: string; reason: string }[];
};

export function loadPayrollRuns(): PayrollRunRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAYROLL_RUNS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PayrollRunRecord[]) : [];
  } catch {
    return [];
  }
}

export function appendPayrollRun(run: PayrollRunRecord): void {
  if (typeof window === "undefined") return;
  const runs = loadPayrollRuns();
  runs.unshift(run);
  localStorage.setItem(PAYROLL_RUNS_STORAGE_KEY, JSON.stringify(runs));
}

export function payrollLinesToCsv(lines: PayrollLine[], periodLabel: string): string {
  const header = [
    "period",
    "employee_name",
    "employee_id",
    "shifts",
    "regular_hours",
    "overtime_hours",
    "total_hours",
    "hourly_rate",
    "gross_pay",
  ];
  const rows = lines.map((l) =>
    [
      escapeCsv(periodLabel),
      escapeCsv(l.employeeName),
      l.employeeId,
      String(l.shiftCount),
      String(l.regularHours),
      String(l.overtimeHours),
      String(l.totalHours),
      String(l.hourlyRate),
      String(l.grossPay),
    ].join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

export function payrollRunToCsv(run: PayrollRunRecord): string {
  return payrollLinesToCsv(run.lines, run.periodLabel);
}

function escapeCsv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
