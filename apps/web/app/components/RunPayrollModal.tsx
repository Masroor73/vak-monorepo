import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { calculatePayrollForEmployee } from "@vak/api";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { Shift as DbShift } from "./ViewShiftModal";
import type { Profile } from "@vak/contract";
import {
  appendPayrollRun,
  addDaysDate,
  buildPayrollLines,
  countShiftsByEmployee,
  distinctEmployeeIds,
  downloadCsv,
  filterShiftsToSelectedWeeks,
  formatPayrollPeriodRange,
  formatSelectedWeeksLabel,
  getMondaysOverlappingMonth,
  getPayrollApiBaseUrl,
  getPayrollApiUrlMisconfigurationMessage,
  getWeekStart,
  parseWeekKeyToLocalDate,
  partitionPayrollShifts,
  payrollLinesToCsv,
  sumGross,
  toPayrollApiShifts,
  weekStartKey,
  type ExcludedShift,
  type PayrollLine,
} from "../../lib/payrollWorkflow";

type Step =
  | "loading-shifts"
  | "select-employees"
  | "calculating"
  | "preview"
  | "confirm"
  | "processing"
  | "success"
  | "error";

type PreviewState = {
  lines: PayrollLine[];
  excluded: ExcludedShift[];
  includedShifts: DbShift[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Suggested week when opening (typically the Shift Management grid week). */
  initialWeekStart: Date;
  employees: Profile[];
};

const MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function RunPayrollModal({
  open,
  onClose,
  initialWeekStart,
  employees,
}: Props) {
  const router = useRouter();
  const { profile } = useAuth();
  const [selectedWeekKeys, setSelectedWeekKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [step, setStep] = useState<Step>("loading-shifts");
  const [error, setError] = useState<string | null>(null);
  /** Shifts eligible for payroll in the selected period (before employee filter). */
  const [fetchedIncluded, setFetchedIncluded] = useState<DbShift[]>([]);
  const [fetchedExcluded, setFetchedExcluded] = useState<ExcludedShift[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    () => new Set()
  );
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [completedRunId, setCompletedRunId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(() => new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear());

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => y - 5 + i);
  }, []);

  /** Checkbox list: Monday-start weeks that overlap the selected calendar month. */
  const weekOptions = useMemo(
    () => getMondaysOverlappingMonth(filterYear, filterMonth),
    [filterYear, filterMonth]
  );

  const sortedWeekStarts = useMemo(() => {
    return Array.from(selectedWeekKeys)
      .sort()
      .map((k) => getWeekStart(parseWeekKeyToLocalDate(k)));
  }, [selectedWeekKeys]);

  const selectionDep = useMemo(
    () => Array.from(selectedWeekKeys).sort().join(","),
    [selectedWeekKeys]
  );

  useLayoutEffect(() => {
    if (!open) return;
    const d = initialWeekStart;
    setFilterMonth(d.getMonth() + 1);
    setFilterYear(d.getFullYear());
    setSelectedWeekKeys(
      new Set([weekStartKey(getWeekStart(initialWeekStart))])
    );
  }, [open, initialWeekStart]);

  const adjustSelectionToMonth = (nextMonth: number, nextYear: number) => {
    const opts = getMondaysOverlappingMonth(nextYear, nextMonth);
    setSelectedWeekKeys((prev) => {
      const valid = new Set(opts.map((w) => weekStartKey(w)));
      const next = new Set([...prev].filter((k) => valid.has(k)));
      if (next.size === 0 && opts.length > 0) {
        next.add(weekStartKey(opts[0]));
      }
      return next;
    });
    setStep((s) => (s === "confirm" ? "preview" : s));
    setPreview(null);
  };

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      setCompletedRunId(null);
      setFetchedIncluded([]);
      setFetchedExcluded([]);
      setSelectedEmployeeIds(new Set());
      return;
    }

    let cancelled = false;

    async function loadShiftsForPeriod() {
      setStep("loading-shifts");
      setError(null);
      setPreview(null);

      if (selectedWeekKeys.size === 0) {
        setError("Select at least one week.");
        setStep("error");
        return;
      }

      const weeks = Array.from(selectedWeekKeys)
        .sort()
        .map((k) => getWeekStart(parseWeekKeyToLocalDate(k)));

      const minWs = weeks[0];
      const maxEndExclusive = addDaysDate(weeks[weeks.length - 1], 7);

      const { data, error: fetchErr } = await supabase
        .from("shifts")
        .select("*")
        .gte("start_time", minWs.toISOString())
        .lt("start_time", maxEndExclusive.toISOString());

      if (cancelled) return;

      if (fetchErr) {
        setError(fetchErr.message);
        setStep("error");
        return;
      }

      const shiftsRaw = (data ?? []) as DbShift[];
      const shifts = filterShiftsToSelectedWeeks(shiftsRaw, weeks);

      const { included, excluded } = partitionPayrollShifts(shifts);

      if (!included.length) {
        const inRange = shifts.length;
        const totalFetched = shiftsRaw.length;
        let msg =
          "No payroll-eligible shifts: need status COMPLETED plus clock-in and clock-out times.";
        if (totalFetched === 0) {
          msg =
            "No shifts with scheduled start in the selected week(s). Check month/year and week checkboxes.";
        } else if (inRange === 0) {
          msg = `Fetched ${totalFetched} shift(s) in the date range, but none fall in the selected week boundaries (timezone/week alignment).`;
        } else {
          msg = `${inRange} shift(s) in selected weeks; none are COMPLETED with full clock-in/out (${excluded.length} excluded: published, draft, or missing actuals).`;
        }
        setError(msg);
        setFetchedIncluded([]);
        setFetchedExcluded([]);
        setStep("error");
        return;
      }

      const payrollUrlMisconfig = getPayrollApiUrlMisconfigurationMessage();
      const base = getPayrollApiBaseUrl();

      if (payrollUrlMisconfig) {
        setError(payrollUrlMisconfig);
        setStep("error");
        return;
      }

      if (!base) {
        setError(
          "Payroll service URL is not configured. Set EXPO_PUBLIC_PAYROLL_API_URL to the Vak Payroll .NET API (e.g. http://localhost:5117). This is not the same as EXPO_PUBLIC_SUPABASE_URL."
        );
        setStep("error");
        return;
      }

      if (cancelled) return;
      setFetchedIncluded(included);
      setFetchedExcluded(excluded);
      setSelectedEmployeeIds(new Set(distinctEmployeeIds(included)));
      setStep("select-employees");
    }

    loadShiftsForPeriod();
    return () => {
      cancelled = true;
    };
  }, [open, selectionDep]);

  const periodLabel = formatSelectedWeeksLabel(sortedWeekStarts);

  const employeeLabel = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e?.full_name?.trim() || e?.email || id;
  };

  const employeeRows = useMemo(() => {
    const ids = distinctEmployeeIds(fetchedIncluded);
    const label = (id: string) => {
      const e = employees.find((x) => x.id === id);
      return e?.full_name?.trim() || e?.email || id;
    };
    return [...ids].sort((a, b) => label(a).localeCompare(label(b)));
  }, [fetchedIncluded, employees]);

  const shiftCountsByEmployee = useMemo(
    () => countShiftsByEmployee(fetchedIncluded),
    [fetchedIncluded]
  );

  const handleCalculatePayroll = async () => {
    if (selectedEmployeeIds.size === 0) {
      setError("Select at least one employee.");
      return;
    }
    const payrollUrlMisconfig = getPayrollApiUrlMisconfigurationMessage();
    const base = getPayrollApiBaseUrl();
    if (payrollUrlMisconfig) {
      setError(payrollUrlMisconfig);
      return;
    }
    if (!base) {
      setError(
        "Payroll service URL is not configured. Set EXPO_PUBLIC_PAYROLL_API_URL to the Vak Payroll .NET API (e.g. http://localhost:5117). This is not the same as EXPO_PUBLIC_SUPABASE_URL."
      );
      return;
    }
    const includedForCalc = fetchedIncluded.filter((s) => selectedEmployeeIds.has(s.employee_id));
    if (!includedForCalc.length) {
      setError("No shifts match the selected employees.");
      return;
    }
    setError(null);
    setStep("calculating");
    try {
      const ids = [...selectedEmployeeIds].sort((a, b) =>
        employeeLabel(a).localeCompare(employeeLabel(b))
      );
      const reports = await Promise.all(
        ids.map(async (id) => {
          const shifts = includedForCalc.filter((s) => s.employee_id === id);
          const res = await calculatePayrollForEmployee(id, toPayrollApiShifts(shifts), {
            baseURL: base,
          });
          return res.data;
        })
      );
      const counts = countShiftsByEmployee(includedForCalc);
      const lines = buildPayrollLines(reports, employees, counts);
      setPreview({ lines, excluded: fetchedExcluded, includedShifts: includedForCalc });
      setStep("preview");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Payroll calculation failed.";
      setError(msg);
      setStep("select-employees");
    }
  };
  const totalPayout = preview ? sumGross(preview.lines) : 0;
  const runnerName =
    profile?.full_name?.trim() || profile?.email || "Current user";

  const canChangePeriod =
    step === "loading-shifts" ||
    step === "select-employees" ||
    step === "preview" ||
    step === "confirm" ||
    step === "error";

  const toggleWeek = (key: string) => {
    setSelectedWeekKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    if (step === "confirm") setStep("preview");
  };

  const toggleEmployee = (id: string) => {
    setError(null);
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (step === "confirm") setStep("preview");
  };

  const handleExportPreviewCsv = () => {
    if (!preview) return;
    const csv = payrollLinesToCsv(preview.lines, periodLabel);
    const tag =
      sortedWeekStarts.length > 0
        ? sortedWeekStarts[0].toISOString().slice(0, 10)
        : "preview";
    downloadCsv(`payroll-preview-${tag}-${sortedWeekStarts.length}w.csv`, csv);
  };

  const handleProcess = () => {
    if (!preview || step !== "confirm" || sortedWeekStarts.length === 0) return;
    setStep("processing");

    const runId = crypto.randomUUID();
    const firstWeek = sortedWeekStarts[0];
    const lastWeekStart = sortedWeekStarts[sortedWeekStarts.length - 1];
    const periodEndLastDay = addDaysDate(lastWeekStart, 6);
    periodEndLastDay.setHours(23, 59, 59, 999);
    const snapshot = preview;

    window.setTimeout(() => {
      appendPayrollRun({
        id: runId,
        periodLabel,
        periodStartIso: firstWeek.toISOString(),
        periodEndIso: periodEndLastDay.toISOString(),
        processedAtIso: new Date().toISOString(),
        processedById: profile?.id ?? "",
        processedByName: runnerName,
        totalPayout,
        includedShiftCount: snapshot.includedShifts.length,
        includedEmployeeCount: snapshot.lines.length,
        excludedCount: snapshot.excluded.length,
        lines: snapshot.lines,
        excluded: snapshot.excluded.map((e) => ({
          shiftId: e.shift.id,
          employeeId: e.shift.employee_id,
          reason: e.reason,
        })),
      });
      setCompletedRunId(runId);
      setStep("success");
    }, 80);
  };

  const handleGoHistory = () => {
    onClose();
    router.push("/payroll");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {step === "success" ? "Payroll complete" : "Run payroll"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{periodLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-gray-100 px-5 py-3 bg-gray-50/90 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Pay period
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="payroll-filter-month"
                className="block text-[11px] font-medium text-gray-500 mb-1"
              >
                Month
              </label>
              <select
                id="payroll-filter-month"
                disabled={!canChangePeriod}
                value={filterMonth}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setFilterMonth(m);
                  adjustSelectionToMonth(m, filterYear);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[140px] disabled:opacity-50"
              >
                {MONTH_OPTIONS.map((mo) => (
                  <option key={mo.value} value={mo.value}>
                    {mo.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="payroll-filter-year"
                className="block text-[11px] font-medium text-gray-500 mb-1"
              >
                Year
              </label>
              <select
                id="payroll-filter-year"
                disabled={!canChangePeriod}
                value={filterYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setFilterYear(y);
                  adjustSelectionToMonth(filterMonth, y);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[88px] disabled:opacity-50"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {weekOptions.length === 0 && (
              <p className="px-3 py-6 text-sm text-gray-500 text-center">
                No Monday-start weeks found for this month (unexpected).
              </p>
            )}
            {weekOptions.map((ws) => {
              const key = weekStartKey(ws);
              const checked = selectedWeekKeys.has(key);
              const rangeLabel = formatPayrollPeriodRange(ws, 1);
              return (
                <label
                  key={key}
                  className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 ${
                    !canChangePeriod ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!canChangePeriod}
                    onChange={() => toggleWeek(key)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-auth-blue focus:ring-auth-blue"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-900">
                      {rangeLabel}
                    </span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">
                      Week of{" "}
                      {ws.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      Includes shifts whose scheduled start falls in this Monday–Sunday week.
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400">
            Shifts are loaded by scheduled start time within the selected week(s). Choose any
            combination of weeks (at least one). Use month and year to show the weeks that
            overlap that calendar month; then tick the weeks to include in payroll.
          </p>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {(step === "loading-shifts" || step === "calculating" || step === "processing") && (
            <div className="py-16 text-center text-gray-600 text-sm">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-auth-blue mb-3" />
              <p>
                {step === "processing"
                  ? "Recording payroll run…"
                  : step === "calculating"
                    ? "Calculating payroll…"
                    : "Loading shifts…"}
              </p>
            </div>
          )}

          {step === "error" && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {step === "select-employees" && (
            <div className="space-y-4 mb-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              <p className="text-[11px] text-gray-500">
                Shifts are loaded for the selected week(s). Choose who to include, then run the
                payroll engine (one API call per employee:{" "}
                <code className="text-[10px] bg-gray-100 px-1 rounded">
                  POST /payroll/{"{employeeId}"}
                </code>
                ).
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Employees to include
                </p>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSelectedEmployeeIds(new Set(distinctEmployeeIds(fetchedIncluded)));
                    }}
                    className="text-auth-blue font-medium hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSelectedEmployeeIds(new Set());
                    }}
                    className="text-auth-blue font-medium hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                {employeeRows.map((id) => {
                  const checked = selectedEmployeeIds.has(id);
                  const n = shiftCountsByEmployee[id] ?? 0;
                  return (
                    <label
                      key={id}
                      className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEmployee(id)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-auth-blue focus:ring-auth-blue"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900">
                          {employeeLabel(id)}
                        </span>
                        <span className="block text-[11px] text-gray-500 mt-0.5">
                          {n} payroll-eligible shift{n === 1 ? "" : "s"} in this period
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {fetchedExcluded.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Excluded shifts (not in payroll)
                  </p>
                  <ul className="text-sm space-y-1 max-h-28 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50/80">
                    {fetchedExcluded.map(({ shift, reason }) => {
                      const emp = employees.find((e) => e.id === shift.employee_id);
                      const label = emp?.full_name ?? emp?.email ?? shift.employee_id;
                      return (
                        <li key={shift.id} className="text-gray-700">
                          <span className="font-medium">{label}</span>
                          <span className="text-gray-400"> — </span>
                          {reason}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {(step === "preview" || step === "confirm") && preview && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Review the calculated hours below. Overtime is shown per the payroll engine;
                gross pay uses each employee&apos;s hourly rate (regular × hours + OT ×{" "}
                {1.5}× rate).
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm border-collapse min-w-[640px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">
                        Employee
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">
                        Shifts
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">
                        Regular h
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">
                        OT h
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">
                        Total h
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">
                        Rate
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">
                        Gross
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.lines.map((row) => (
                      <tr
                        key={row.employeeId}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-3 py-2 text-gray-900">{row.employeeName}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {row.shiftCount}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {row.regularHours.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {row.overtimeHours.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {row.totalHours.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          ${row.hourlyRate.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                          ${row.grossPay.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-gray-600">
                  Total payout:{" "}
                  <span className="font-semibold text-gray-900">
                    ${totalPayout.toFixed(2)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleExportPreviewCsv}
                  className="text-auth-blue font-medium hover:underline"
                >
                  Export preview CSV
                </button>
              </div>

              {preview.excluded.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Excluded shifts
                  </p>
                  <ul className="text-sm space-y-1 max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50/80">
                    {preview.excluded.map(({ shift, reason }) => {
                      const emp = employees.find((e) => e.id === shift.employee_id);
                      const label = emp?.full_name ?? emp?.email ?? shift.employee_id;
                      return (
                        <li key={shift.id} className="text-gray-700">
                          <span className="font-medium">{label}</span>
                          <span className="text-gray-400"> — </span>
                          {reason}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step === "confirm" && preview && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900">
              <p className="font-semibold">Confirm processing</p>
              <p className="mt-1">
                This will record a payroll run in this browser (local history). It does not
                call a separate &quot;process&quot; API — the payroll engine was already used
                for the preview above.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-0.5 text-red-800/90">
                <li>Period: {periodLabel}</li>
                <li>Run by: {runnerName}</li>
                <li>
                  Approved shifts included: {preview.includedShifts.length} · Employees:{" "}
                  {preview.lines.length}
                </li>
                {preview.excluded.length > 0 && (
                  <li>Excluded entries: {preview.excluded.length}</li>
                )}
                <li>Total payout: ${totalPayout.toFixed(2)}</li>
                <li>Persistence: browser local storage (this device)</li>
              </ul>
            </div>
          )}

          {step === "success" && preview && (
            <div className="space-y-3 text-sm text-gray-800">
              <p className="text-green-700 font-medium">
                Payroll run saved successfully.
              </p>
              {completedRunId && (
                <p>
                  <span className="text-gray-500">Run ID:</span>{" "}
                  <code className="text-xs bg-gray-100 px-1 rounded">{completedRunId}</code>
                </p>
              )}
              <p>
                Total paid:{" "}
                <span className="font-semibold">${totalPayout.toFixed(2)}</span> ·{" "}
                {preview.lines.length} employees · {preview.includedShifts.length} shifts
              </p>
              {preview.excluded.length > 0 && (
                <p className="text-gray-600">
                  {preview.excluded.length} shift(s) were excluded (see Payroll page details
                  for this run).
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const csv = payrollLinesToCsv(preview.lines, periodLabel);
                    downloadCsv(
                      `payroll-run-${completedRunId ?? "export"}.csv`,
                      csv
                    );
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={handleGoHistory}
                  className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700"
                >
                  View payroll history
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 flex flex-wrap justify-end gap-2 bg-gray-50/80">
          {(step === "loading-shifts" || step === "calculating") && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              Cancel
            </button>
          )}

          {step === "select-employees" && (
            <>
              {preview ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("preview");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                >
                  Back to results
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleCalculatePayroll}
                disabled={selectedEmployeeIds.size === 0}
                className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                Calculate payroll
              </button>
            </>
          )}

          {step === "preview" && preview && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("select-employees");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
              >
                Change employees
              </button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700"
              >
                Continue to confirmation
              </button>
            </>
          )}

          {step === "confirm" && preview && (
            <>
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleProcess}
                className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700"
              >
                Process payroll
              </button>
            </>
          )}

          {step === "error" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              Close
            </button>
          )}

          {step === "success" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
