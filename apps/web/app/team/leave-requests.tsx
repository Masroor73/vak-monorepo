import { Link } from "expo-router";
import ManagerLayout from "../layouts/ManagerLayout";

const ACCENT = "#62CCEF";

type LeaveRequest = {
  id: string;
  name: string;
  from: string;
  to: string;
  status: "Pending" | "Approved" | "Declined";
  reason?: string;
};

const rows: LeaveRequest[] = [
  { id: "lr-1", name: "Ahmad. K.", from: "Nov 19", to: "Nov 21", status: "Pending" },
  { id: "lr-2", name: "Kathryn Murphy", from: "Nov 21", to: "Nov 25", status: "Pending" },
  { id: "lr-3", name: "Emma Owen", from: "Nov 25", to: "Nov 28", status: "Pending" },
];

function StatusPill({ s }: { s: LeaveRequest["status"] }) {
  const cls =
    s === "Approved"
      ? "bg-green-200 text-green-800"
      : s === "Declined"
      ? "bg-red-200 text-red-800"
      : "bg-yellow-200 text-yellow-900";
  return <span className={`px-4 py-1 rounded-full text-xs font-medium ${cls}`}>{s}</span>;
}

export default function LeaveRequests() {
  return (
    <ManagerLayout>
      <div className="rounded-2xl border-2 p-6" style={{ borderColor: ACCENT, backgroundColor: "#D9D9D9" }}>
        <div className="bg-white border rounded-xl p-6">
          <div className="text-xs text-gray-500 mb-2">Team &gt; Review leave Request</div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Leave Request</h1>
            <button className="bg-[#0B2E6D] text-white px-4 py-2 rounded-lg text-sm">
              View All ▾
            </button>
          </div>

          <div className="mt-6 border-t" />

          <div className="grid grid-cols-5 gap-4 text-xs text-gray-500 mt-4 mb-2">
            <div>Name</div>
            <div>From</div>
            <div>To</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-5 gap-4 items-center py-3 border-t">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="text-sm font-medium">{r.name}</div>
                </div>

                <div className="text-sm">{r.from}</div>
                <div className="text-sm">{r.to}</div>

                <div>
                  <StatusPill s={r.status} />
                </div>

                <div className="flex items-center justify-end gap-4">
                  <Link href={`/team/leave-requests/${r.id}`} className="text-green-700 text-sm font-semibold">
                    ⓘ
                  </Link>
                  <button className="text-gray-600 text-lg leading-none">⋮</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
