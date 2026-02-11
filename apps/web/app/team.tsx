import type React from "react";
import { Link } from "expo-router";
import ManagerLayout from "./layouts/ManagerLayout";

const ACCENT = "#62CCEF";

type LeaveRequest = {
  id: string;
  name: string;
  from: string;
  to: string;
  status: "Pending" | "Approved" | "Declined";
};

type SwapRequest = {
  id: string;
  fromName: string;
  toName: string;
  date: string;
  location: string;
};

type Feedback = {
  id: string;
  text: string;
  from: string;
  date: string;
};

type Employee = {
  id: string;
  name: string;
  role: string;
};

const leaveRequests: LeaveRequest[] = [
  { id: "lr-1", name: "Ahmad. K.", from: "Nov 19, 2025", to: "Nov 21, 2025", status: "Pending" },
];

const swapRequests: SwapRequest[] = [
  { id: "sr-1", fromName: "Emma Owen", toName: "Jacob Greens", date: "Nov 22, 2025", location: "Main Branch" },
];

const feedbacks: Feedback[] = [
  {
    id: "f-1",
    text:
      "It would be really helpful to have quick task reminders pop up during the opening shift, just so we don’t miss anything when it gets busy.",
    from: "Sarah L.",
    date: "Nov 9, 2025",
  },
  {
    id: "f-2",
    text:
      "I just wanted to say thank you for posting the schedule early this week, it really helps with planning ahead",
    from: "Jane L.",
    date: "Nov 9, 2025",
  },
];

const employees: Employee[] = [
  { id: "e-1", name: "Sarah Willis", role: "Supervisor" },
  { id: "e-2", name: "Jacob Greens", role: "Stock Clerk" },
  { id: "e-3", name: "Emma Owen", role: "Cashier" },
];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="text-base font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function MiniCard({ children }: { children: React.ReactNode }) {
  return <div className="border rounded-xl p-4 bg-white shadow-sm">{children}</div>;
}

function Pill({ text, variant }: { text: string; variant: "pending" | "approved" | "declined" }) {
  const cls =
    variant === "approved"
      ? "bg-green-200 text-green-800"
      : variant === "declined"
      ? "bg-red-200 text-red-800"
      : "bg-yellow-200 text-yellow-900";
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>{text}</span>;
}

export default function Team() {
  return (
    <ManagerLayout>
      <div
        className="rounded-2xl border-2 p-6 w-full"
        style={{ borderColor: ACCENT, backgroundColor: "#D9D9D9" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TOP ROW */}
          <Panel title="Review Leave Request">
            <div className="text-xs text-gray-500 -mt-1 mb-3">
              Review and manage employee leave requests
            </div>

            <div className="inline-flex items-center gap-2 bg-gray-100 border rounded-full px-3 py-1 text-xs mb-4">
              <span className="font-medium">Pending Requests</span>
              <span className="bg-white border rounded-full px-2 py-0.5">{leaveRequests.length}</span>
            </div>

            {leaveRequests.map((lr) => (
              <Link key={lr.id} href={`/team/leave-requests/${lr.id}`} className="block">
                <MiniCard>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{lr.name}</div>
                    <Pill text={lr.status} variant="pending" />
                  </div>

                  <div className="mt-3 text-xs text-gray-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">From:</span> {lr.from}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">To:</span> {lr.to}
                    </div>
                  </div>
                </MiniCard>
              </Link>
            ))}

            <div className="mt-4">
              <Link href="/team/leave-requests" className="text-sm font-medium text-blue-700">
                View All →
              </Link>
            </div>
          </Panel>

          <Panel title="Review Shift Swap Request">
            <div className="text-xs text-gray-500 -mt-1 mb-4">
              Review and manage employee shift swap requests
            </div>

            {swapRequests.map((sr) => (
              <MiniCard key={sr.id}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{sr.fromName}</span>
                  <span className="text-gray-400">⇄</span>
                  <span>{sr.toName}</span>
                </div>

                <div className="mt-3 text-xs text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📅</span> {sr.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📍</span> {sr.location}
                  </div>
                </div>
              </MiniCard>
            ))}
          </Panel>

          <Panel title="Publish Feedback">
            <div className="text-xs text-blue-700 font-medium mb-2">Draft:</div>

            <div className="border rounded-xl p-4 bg-white relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-green-500" />
              <div className="text-sm font-semibold">Great Job Team!</div>

              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <span>Nov 03, 2025</span>
                <span>•</span>
                <span>Manager</span>
              </div>

              <div className="inline-flex items-center gap-2 mt-2 text-xs bg-gray-100 border rounded-full px-3 py-1">
                <span>All staff</span>
              </div>

              <div className="text-sm text-gray-700 mt-3">
                Overall Food Wastage Has Reduced. Fantastic Work!
              </div>

              <div className="flex gap-3 mt-4 justify-end">
                <button className="border rounded-md px-4 py-1 text-sm">Edit</button>
                <button className="border rounded-md px-4 py-1 text-sm">Delete</button>
              </div>
            </div>
          </Panel>

          {/* BOTTOM ROW */}
          <div className="lg:col-span-2">
            <Panel title="Feedback Received From Employees">
              <div className="space-y-4">
                {feedbacks.map((f) => (
                  <div key={f.id} className="border rounded-xl p-4 bg-white relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-green-500" />
                    <div className="text-sm text-gray-700">{f.text}</div>
                    <div className="mt-3 text-xs text-gray-500 flex justify-end gap-6">
                      <span>
                        <span className="font-medium">Date:</span> {f.date}
                      </span>
                      <span>
                        <span className="font-medium">From:</span> {f.from}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="List of Employees">
            <div className="border-b pb-2 text-xs text-gray-500 flex justify-between">
              <span>Employee Name</span>
              <span>Role</span>
            </div>

            <div className="mt-3 space-y-3">
              {employees.map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                    <div className="text-sm font-medium">{e.name}</div>
                  </div>
                  <div className="text-sm text-gray-700 flex items-center gap-3">
                    <span>{e.role}</span>
                    <span className="text-gray-400">›</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-6 w-full bg-[#0B2E6D] text-white rounded-lg py-2 text-sm">
              See More
            </button>
          </Panel>
        </div>
      </div>
    </ManagerLayout>
  );
}
