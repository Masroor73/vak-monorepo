//web/app/team.tsx
import type React from "react";
import { Link } from "expo-router";
import ManagerLayout from "./layouts/ManagerLayout";
import { useEmployees } from "@vak/api";
import { useAuthGuard } from "../hooks/useAuthGuard";

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

type DraftAnnouncement = {
  id: string;
  title: string;
  date: string;
  author: string;
  audienceLabel: string;
  body: string;
};

const leaveRequests: LeaveRequest[] = [
  {
    id: "lr-1",
    name: "Ahmad. K.",
    from: "Nov 19, 2025",
    to: "Nov 21, 2025",
    status: "Pending",
  },
];

const swapRequests: SwapRequest[] = [
  {
    id: "sr-1",
    fromName: "Emma Owen",
    toName: "Jacob Greens",
    date: "Nov 22, 2025",
    location: "Main Branch",
  },
];

const feedbacks: Feedback[] = [
  {
    id: "f-1",
    text:
      "It would be really helpful to have quick task reminders pop up during the opening shift, just so we don't miss anything when it gets busy.",
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

const draftAnnouncements: DraftAnnouncement[] = [
  {
    id: "draft-1",
    title: "Great Job Team!",
    date: "Nov 03, 2025",
    author: "Manager",
    audienceLabel: "All staff",
    body: "Overall Food Wastage Has Reduced. Fantastic Work!",
  },
];

function Panel({
  title,
  subtitle,
  children,
  headerRight,
  footer,
}: {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.12)] p-5 md:p-6 h-full flex flex-col">
      <div className="relative">
        {headerRight ? (
          <div className="absolute right-0 top-0">{headerRight}</div>
        ) : null}

        <div className="pr-44">
          <h2 className="text-lg font-semibold text-black">{title}</h2>
          {subtitle ? (
            <div className="text-sm text-black/50 mt-1">{subtitle}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex-1">{children}</div>

      {footer ? <div className="pt-4">{footer}</div> : null}
    </section>
  );
}

function Cards({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-black/10 shadow-[0_4px_12px_rgba(0,0,0,0.10)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function StateBadge({ text }: { text: string }) {
  return (
    <span className="px-4 py-1.5 text-sm font-semibold bg-[#FFF2B8] text-[#6B4E00] border border-black/10">
      {text}
    </span>
  );
}

function CountBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center bg-[#BFEAF7] px-5 py-2 text-sm font-medium text-black">
      {text}
    </span>
  );
}

function DraftCard({ draft }: { draft: DraftAnnouncement }) {
  return (
    <Cards className="relative p-6 flex flex-col">
      <div className="absolute left-0 top-4 bottom-4 w-1 bg-green-500" />

      <div className="pl-4">
        <div className="text-lg font-semibold text-black">{draft.title}</div>

        <div className="text-sm text-black/60 mt-2 flex items-center gap-2">
          <span>{draft.date}</span>
          <span>•</span>
          <span>{draft.author}</span>
        </div>

        <div className="mt-3 inline-flex items-center bg-[#E6F7FF] px-5 py-2 text-sm font-semibold border border-black/10">
          {draft.audienceLabel}
        </div>

        <div className="mt-4 text-base text-black/75">{draft.body}</div>
      </div>

      <div className="pl-4 mt-5 flex gap-4 justify-end">
        <button className="px-7 py-2.5 rounded-full border border-black/15 text-sm font-semibold hover:bg-black/5 transition">
          Edit
        </button>
        <button className="px-7 py-2.5 rounded-full border border-black/15 text-sm font-semibold hover:bg-black/5 transition">
          Delete
        </button>
      </div>
    </Cards>
  );
}

export default function Team() {
  useAuthGuard();
  const { data: employees = [], isLoading, error } = useEmployees();

  const CardHeight = "lg:h-[210px]";

  return (
    <ManagerLayout>
      <div className="w-full rounded-[24px] p-6 md:p-8 bg-[#D9D9D9]">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-6 auto-rows-fr items-stretch">
          <Panel
            title="Review Leave Request"
            headerRight={
              <CountBadge text={`Pending Requests (${leaveRequests.length})`} />
            }
            footer={
              <Link
                href="/team/leave-requests"
                className="text-sm font-semibold text-[#0B2E6D]"
              >
                View All →
              </Link>
            }
          >
            {leaveRequests.map((lr) => (
              <Link
                key={lr.id}
                href={`/team/leave-requests/${lr.id}`}
                className="block"
              >
                <Cards className={`${CardHeight} p-6`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#FBC02D]/30 border border-black/10 flex items-center justify-center text-base font-bold text-black">
                        AK
                      </div>
                      <div className="text-lg font-semibold text-black">
                        {lr.name}
                      </div>
                    </div>
                    <StateBadge text={lr.status} />
                  </div>

                  <div className="mt-5 space-y-3 text-base text-black/70">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📅</span>
                      <span className="font-medium">From:</span> {lr.from}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📅</span>
                      <span className="font-medium">To:</span> {lr.to}
                    </div>
                  </div>
                </Cards>
              </Link>
            ))}
          </Panel>

          <Panel title="Review Shift Swap Request">
            {swapRequests.map((sr) => (
              <Cards key={sr.id} className={`${CardHeight} p-6`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-lg font-semibold text-black">
                    {sr.fromName} <span className="text-black/40">⇄</span>{" "}
                    {sr.toName}
                  </div>

                  <div className="flex -space-x-2">
                    <div className="h-10 w-10 rounded-full bg-black/10 border-2 border-white" />
                    <div className="h-10 w-10 rounded-full bg-black/15 border-2 border-white" />
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-base text-black/70">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📅</span> {sr.date}
                  </div>
                  <div className="flex items-center gap-3">
                     {sr.location}
                  </div>
                </div>
              </Cards>
            ))}
          </Panel>

          <Panel
            title="Publish Feedback"
            headerRight={
              <div className="text-sm font-semibold text-[#0B2E6D]">Draft:</div>
            }
          >
            {draftAnnouncements.length === 0 ? (
              <div className="text-sm text-black/60">No draft announcements.</div>
            ) : (
              <div className="space-y-4">
                {draftAnnouncements.map((draft) => (
                  <DraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </Panel>

          <div className="lg:col-span-2 lg:row-start-2">
            <Panel title="Feedback Received From Employees">
              <div className="space-y-4">
                {feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="relative border border-black/10 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.10)] p-4"
                  >
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-green-500" />

                    <div className="pl-3 text-sm text-black/80">{f.text}</div>

                    <div className="pl-3 mt-3 text-xs text-black/55 flex justify-end gap-6">
                      <span>
                        <span className="font-semibold">Date:</span> {f.date}
                      </span>
                      <span>
                        <span className="font-semibold">From:</span> {f.from}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="lg:col-span-1 lg:row-start-2">
            <Panel title="List of Employees">
              <div className="border-b border-black/10 pb-2 text-sm text-black/55 flex justify-between">
                <span>Employee Name</span>
                <span>Role</span>
              </div>

              <div className="mt-3">
                {isLoading ? (
                  <div className="text-sm text-black/60 py-3">
                    Loading employees…
                  </div>
                ) : error ? (
                  <div className="text-sm text-red-600 py-3">
                    Failed to load employees.
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-sm text-black/60 py-3">
                    No employees found.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {employees.slice(0, 7).map((e: any) => (
                      <button
                        key={e.id}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-3 hover:bg-black/5 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-black/10 border border-black/10" />
                          <div className="text-base font-semibold text-black">
                            {e.full_name ?? "Unnamed"}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-black/70">
                          <span>{e.role ?? "EMPLOYEE"}</span>
                          <span className="text-black/40 text-xl">›</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <button className="bg-[#0B2E6D] text-white rounded-full px-8 py-2 text-sm font-semibold hover:opacity-95 transition">
                  See More
                </button>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}