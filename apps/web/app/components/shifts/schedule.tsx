import React, { useMemo, useState } from "react";
import ManagerLayout from "../../layouts/ManagerLayout";


type ShiftStatus = "DRAFT" | "PUBLISHED";

type Shift = {
  id: string;
  employeeName: string;
  role: string;
  startTime: string; 
  endTime: string; 
  status: ShiftStatus;
};

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); 
  const diff = (day === 0 ? -6 : 1) - day; 
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtDayHeader(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function Badge({ status }: { status: ShiftStatus }) {
  const cls =
    status === "PUBLISHED"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${cls}`}>
      {status}
    </span>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-black/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="text-black/60 hover:text-black text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: "1",
      employeeName: "Sarah Willis",
      role: "SERVER",
      startTime: new Date().toISOString(),
      endTime: addDays(new Date(), 0).toISOString(),
      status: "DRAFT",
    },
    {
      id: "2",
      employeeName: "Jacob Greens",
      role: "COOK",
      startTime: addDays(new Date(), 1).toISOString(),
      endTime: addDays(new Date(), 1).toISOString(),
      status: "PUBLISHED",
    },
    {
      id: "3",
      employeeName: "Emma Owen",
      role: "HOST",
      startTime: addDays(new Date(), 2).toISOString(),
      endTime: addDays(new Date(), 2).toISOString(),
      status: "DRAFT",
    },
  ]);

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const weekStart = useMemo(() => startOfWeekMonday(new Date()), []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const shiftsByDay = useMemo(() => {
    return days.map((day) => {
      const list = shifts.filter((s) => sameDay(new Date(s.startTime), day));
      return list;
    });
  }, [days, shifts]);

  function publishAllForWeek() {
    setShifts((prev) =>
      prev.map((s) => ({
        ...s,
        status: "PUBLISHED",
      }))
    );

  }

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-2xl font-semibold text-white">Schedule</div>
          <div className="text-white/70 text-sm">
            Week of {weekStart.toLocaleDateString()}
          </div>
        </div>

        <button
          onClick={publishAllForWeek}
          className="bg-white text-black rounded-xl px-5 py-3 font-medium shadow hover:bg-black/5 transition"
        >
          Publish All (Week)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day, idx) => (
          <div
            key={day.toISOString()}
            className="bg-white rounded-2xl border border-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.12)] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-black/10">
              <div className="text-sm font-semibold">{fmtDayHeader(day)}</div>
            </div>

            <div className="p-3 space-y-3 min-h-[160px]">
              {shiftsByDay[idx].length === 0 ? (
                <div className="text-xs text-black/40">No shifts</div>
              ) : (
                shiftsByDay[idx].map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => setSelectedShift(shift)}
                    className="w-full text-left rounded-2xl border border-black/10 p-3 hover:bg-black/5 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{shift.employeeName}</div>
                      <Badge status={shift.status} />
                    </div>
                    <div className="text-xs text-black/60 mt-1">
                      {shift.role} • {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!selectedShift}
        title="Edit Shift"
        onClose={() => setSelectedShift(null)}
      >
        {selectedShift ? (
          <div className="space-y-4">
            <div className="text-sm text-black/70">
              <div><span className="font-semibold">Employee:</span> {selectedShift.employeeName}</div>
              <div><span className="font-semibold">Role:</span> {selectedShift.role}</div>
              <div>
                <span className="font-semibold">Time:</span>{" "}
                {fmtTime(selectedShift.startTime)} – {fmtTime(selectedShift.endTime)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-semibold">Status:</span>
                <Badge status={selectedShift.status} />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedShift(null)}
                className="px-4 py-2 rounded-xl border border-black/10 hover:bg-black/5"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setShifts((prev) =>
                    prev.map((s) =>
                      s.id === selectedShift.id
                        ? {
                            ...s,
                            status: s.status === "DRAFT" ? "PUBLISHED" : "DRAFT",
                          }
                        : s
                    )
                  );
                  setSelectedShift(null);
                }}
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-black/90"
              >
                Toggle Draft/Published
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </ManagerLayout>
  );
}