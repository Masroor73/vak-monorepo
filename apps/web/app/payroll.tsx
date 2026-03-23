import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import ManagerLayout from "./layouts/ManagerLayout";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useAuth } from "../context/AuthContext";
import {
  downloadCsv,
  loadPayrollRuns,
  payrollRunToCsv,
  type PayrollRunRecord,
} from "../lib/payrollWorkflow";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function PayrollPage() {
  useAuthGuard();
  const router = useRouter();
  const { isManager, loading: authLoading } = useAuth();
  const [runs, setRuns] = useState<PayrollRunRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRuns(loadPayrollRuns());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (authLoading) return;
    if (!isManager) router.replace("/");
  }, [authLoading, isManager, router]);

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (authLoading || !isManager) {
    return (
      <ManagerLayout>
        <div className="py-20 text-center text-gray-400 text-sm">Loading…</div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Past payroll runs (stored in this browser)
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/shifts")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            <Ionicons name="calendar-outline" size={18} color="#374151" />
            Shift management
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <p className="text-gray-600 text-sm mb-2">No payroll runs yet.</p>
            <p className="text-gray-400 text-xs mb-4">
              Run weekly payroll from Shift Management to see history here.
            </p>
            <button
              type="button"
              onClick={() => router.push("/shifts")}
              className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700"
            >
              Go to shifts
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => {
              const open = expandedId === run.id;
              return (
                <div
                  key={run.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(open ? null : run.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(open ? null : run.id);
                      }
                    }}
                    className="w-full flex flex-wrap items-center justify-between gap-3 text-left px-5 py-4 hover:bg-gray-50/80 cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{run.periodLabel}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Processed {formatWhen(run.processedAtIso)} · {run.processedByName}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadCsv(`payroll-${run.id}.csv`, payrollRunToCsv(run));
                        }}
                        className="text-sm text-auth-blue font-medium hover:underline"
                      >
                        CSV
                      </button>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        ${run.totalPayout.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {run.includedShiftCount} shifts · {run.includedEmployeeCount} people
                      </span>
                      <Ionicons
                        name={open ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#9CA3AF"
                      />
                    </div>
                  </div>

                  {open && (
                    <div className="px-5 py-4 bg-gray-50/50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Run details
                      </p>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700 mb-4">
                        <div>
                          <dt className="text-gray-500">Run ID</dt>
                          <dd className="font-mono text-xs break-all">{run.id}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Excluded shifts</dt>
                          <dd>{run.excludedCount}</dd>
                        </div>
                      </dl>

                      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <table className="w-full text-sm min-w-[560px]">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium text-gray-600">
                                Employee
                              </th>
                              <th className="text-right px-3 py-2 font-medium text-gray-600">
                                Shifts
                              </th>
                              <th className="text-right px-3 py-2 font-medium text-gray-600">
                                Gross
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {run.lines.map((l) => (
                              <tr key={l.employeeId} className="border-b border-gray-100 last:border-0">
                                <td className="px-3 py-2">{l.employeeName}</td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {l.shiftCount}
                                </td>
                                <td className="px-3 py-2 text-right font-medium tabular-nums">
                                  ${l.grossPay.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {run.excluded.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Excluded
                          </p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {run.excluded.map((ex) => (
                              <li key={ex.shiftId}>
                                <span className="font-mono text-xs">{ex.shiftId.slice(0, 8)}…</span>
                                {" — "}
                                {ex.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
