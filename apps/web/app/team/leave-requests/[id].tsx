import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import ManagerLayout from "../../layouts/ManagerLayout";

const ACCENT = "#62CCEF";

type LeaveRequest = {
  id: string;
  name: string;
  submitted: string;
  from: string;
  to: string;
};

const mock: Record<string, LeaveRequest> = {
  "lr-1": {
    id: "lr-1",
    name: "Ahmad K.",
    submitted: "Monday 17th November 2025",
    from: "Wednesday 19th November 2025",
    to: "Friday 21st November 2025",
  },
  "lr-2": {
    id: "lr-2",
    name: "Kathryn Murphy",
    submitted: "Thursday 20th November 2025",
    from: "Friday 21st November 2025",
    to: "Tuesday 25th November 2025",
  },
  "lr-3": {
    id: "lr-3",
    name: "Emma Owen",
    submitted: "Sunday 23rd November 2025",
    from: "Tuesday 25th November 2025",
    to: "Friday 28th November 2025",
  },
};

export default function LeaveRequestDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const req = useMemo(() => (id ? mock[id] : undefined), [id]);

  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  if (!req) {
    return (
      <ManagerLayout>
        <div className="p-10">Leave request not found.</div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      <div className="rounded-2xl border-2 p-6" style={{ borderColor: ACCENT, backgroundColor: "#D9D9D9" }}>
        <div className="bg-white border rounded-xl p-6">
          <div className="text-xs text-gray-500 mb-2">
            <Link href="/team" className="hover:underline">Team</Link> &gt;{" "}
            <Link href="/team/leave-requests" className="hover:underline">Review leave Request</Link> &gt; Details
          </div>

          <h1 className="text-2xl font-bold">Leave Request - {req.name}</h1>

          <div className="text-sm text-gray-500 mt-1 flex gap-6">
            <span>Submitted</span>
            <span>{req.submitted}</span>
          </div>

          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="flex items-center gap-4">
                <div className="font-semibold w-12">From</div>
                <div className="bg-gray-100 rounded-lg px-4 py-3 w-full">{req.from}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="font-semibold w-12">To</div>
                <div className="bg-gray-100 rounded-lg px-4 py-3 w-full">{req.to}</div>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">Reason</div>
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-full bg-gray-200 mt-1" />
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-gray-100 rounded-lg p-4 min-h-[90px] outline-none"
                />
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">Comment</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-gray-100 rounded-lg p-4 min-h-[90px] outline-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <button
                className="bg-[#0B2E6D] text-white rounded-lg px-6 py-3 text-sm"
                onClick={() => router.push("/team/leave-requests")}
              >
                Approve and Notify
              </button>

              <button
                className="bg-[#E58B8B] text-white rounded-lg px-6 py-3 text-sm"
                onClick={() => router.push("/team/leave-requests")}
              >
                Decline and Notify
              </button>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
