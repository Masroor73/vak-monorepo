import type React from "react";
import ManagerLayout from "../layouts/ManagerLayout";
import { Link } from "expo-router";

function Tile({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value?: string | number;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="bg-[#8DD4EC] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.18)] p-6 flex items-center justify-between h-[110px]">
      <div>
        <div className="text-[#0B2E6D] text-lg font-medium">{title}</div>
        {value !== undefined ? (
          <div className="text-[#0B2E6D] text-2xl font-semibold mt-2">
            {value}
          </div>
        ) : null}
      </div>

      <div className="h-12 w-12 self-center rounded-xl bg-white/80 flex items-center justify-center text-[#0B2E6D]">
        {icon}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function Card({
  title,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={[
        "bg-white rounded-2xl border border-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.12)]",
        "flex flex-col",
        className,
      ].join(" ")}
    >
      <div className="px-5 pt-4 text-lg font-semibold text-black">{title}</div>

      <div
        className={[
          "px-5 pb-4 pt-2 flex-1 min-h-0 overflow-auto",
          bodyClassName,
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}

function ChartPlaceholder({ fill = false }: { fill?: boolean }) {
  return (
    <div
      className={[
        // always sharp corners per request
        "rounded-none",
        "bg-[#F3F3F3] border border-black/10 flex items-center justify-center text-black/40",
        fill ? "h-full w-full" : "h-[230px] w-full",
      ].join(" ")}
    >
      Chart Placeholder
    </div>
  );
}

function ActionButton({
  icon,
  label,
  href,
  sharp = false,
}: {
  icon: string;
  label: string;
  href?: string;
  sharp?: boolean;
}) {
  const content = (
    <div
      className={[
        "w-full bg-white border border-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.10)] px-5 py-4 flex items-center gap-4 hover:bg-black/5 transition",
        "min-h-[64px]",
        sharp ? "rounded-none" : "rounded-2xl",
      ].join(" ")}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-lg font-medium text-black">{label}</span>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function Dashboard() {
  const CARD_H = "h-[360px]";

  const staff = [
    { name: "Sarah Willis", status: "active" as const },
    { name: "Jacob Greens", status: "break" as const },
    { name: "Emma Owen", status: "active" as const },
  ];

  const events = [
    "Shift Swap Request — Sarah L. ↔ Daniel R.",
    "Maintenance Update — Owen #2 (Temp Sensor Fault)",
  ];

  const onLeave = [
    { name: "Ahmad. K.", role: "Supervisor" },
    { name: "Alex", role: "Stock Clerk" },
  ];

  const performance = [
    { name: "Sarah Wells", rate: "75%" },
    { name: "Mae Rose", rate: "82%" },
    { name: "Judy", rate: "87%" },
    { name: "Elli", rate: "94%" },
  ];

  return (
    <ManagerLayout>
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Tile title="Total Employees" value={40} icon={"👥"} href="/team" />
          <Tile
            title="Pending shift assignment"
            value={5}
            icon={"🕒"}
            href="/team"
          />
          <Tile title="Maintenance" icon={"🔧"} href="/operations" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <Card title="Staff Overview" className={CARD_H}>
            <div className="text-base text-black/70 mb-4">
              2 active and 2 on break out of 40 total
            </div>

            <div className="space-y-5">
              {staff.map((s) => (
                <div key={s.name} className="flex items-center gap-4">
                  <span
                    className={[
                      "h-3.5 w-3.5 rounded-full",
                      s.status === "active" ? "bg-cyan-400" : "bg-black",
                    ].join(" ")}
                  />
                  <div className="h-12 w-12 rounded-full bg-black/10 border border-black/10" />
                  <div className="text-lg font-medium text-black">
                    {s.name}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Scheduled vs Actual hours worked"
            className={CARD_H}
            bodyClassName="flex min-h-0"
          >
            <ChartPlaceholder fill />
          </Card>

          <Card title="Employees on leave" className={CARD_H}>
            <div className="space-y-5">
              {onLeave.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-orange-600/30 border border-black/10" />
                    <div>
                      <div className="text-lg font-medium text-black">
                        {p.name}
                      </div>
                      <div className="text-sm text-black/50">{p.role}</div>
                    </div>
                  </div>
                  <span className="text-black/40 text-2xl">›</span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Performance Overview"
            className={CARD_H}
            bodyClassName="overflow-auto"
          >
            <div className="grid grid-cols-2 text-base font-medium text-black/70 border-b border-black/10 pb-3">
              <span>Employee Name</span>
              <span className="text-right">Task Completion Rate</span>
            </div>

            <div className="mt-5 space-y-5">
              {performance.map((r) => (
                <div key={r.name} className="grid grid-cols-2 items-center">
                  <span className="text-lg font-medium text-black">
                    {r.name}
                  </span>
                  <span className="text-lg font-semibold text-black text-right">
                    {r.rate}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Employees"
            className={CARD_H}
            bodyClassName="flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-cyan-400">15 part Time</span>
              <span className="text-black">20 Full Time</span>
              <span className="text-red-500">5 Temporary</span>
            </div>

            <div className="flex-1 min-h-0">
              <ChartPlaceholder fill />
            </div>
          </Card>

          <Card title="Quick Actions & Events" className={CARD_H}>
            <div className="flex flex-col gap-3">
              <ActionButton
                icon="📅"
                label="Edit Schedule"
                href="/operations"
                sharp
              />
              <ActionButton
                icon="⚠️"
                label="View issues"
                href="/operations"
                sharp
              />

              <div className="pt-1">
                <div className="text-sm font-semibold text-black mb-2">
                  Today’s Events
                </div>

                <div className="space-y-2 text-sm text-black/70">
                  {events.map((e) => (
                    <div key={e} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ManagerLayout>
  );
}