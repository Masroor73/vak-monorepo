import ManagerLayout from "./_layout/ManagerLayout";
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
    <div className="bg-[#8DD4EC] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.18)] p-6 flex items-center justify-between">
      <div>
        <div className="text-[#0B2E6D] text-lg font-medium">{title}</div>
        {value !== undefined ? (
          <div className="text-[#0B2E6D] text-2xl font-semibold mt-2">
            {value}
          </div>
        ) : null}
      </div>

      <div className="h-12 w-12 rounded-xl bg-white/80 flex items-center justify-center text-[#0B2E6D]">
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
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "bg-white rounded-2xl border border-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.12)]",
        className,
      ].join(" ")}
    >
      <div className="px-6 pt-5 text-lg font-semibold text-black">{title}</div>
      <div className="px-6 pb-6 pt-3">{children}</div>
    </section>
  );
}

function ChartPlaceholder({ height = 230 }: { height?: number }) {
  return (
    <div
      className="rounded-2xl bg-[#F3F3F3] border border-black/10 flex items-center justify-center text-black/40"
      style={{ height }}
    >
      Chart Placeholder
    </div>
  );
}

function ActionButton({
  icon,
  label,
  href,
}: {
  icon: string;
  label: string;
  href?: string;
}) {
  const content = (
    <div className="w-full bg-white rounded-2xl border border-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.10)] px-6 py-5 flex items-center gap-4 hover:bg-black/5 transition">
      <span className="text-2xl">{icon}</span>
      <span className="text-lg font-medium text-black">{label}</span>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function Dashboard() {
  // Placeholder data
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
      <div className="grid grid-cols-12 gap-x-6 gap-y-4 items-start">
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Tile title="Total Employees" value={40} icon={"👥"} href="/team" />
          <Tile
            title="Pending shift assignment"
            value={5}
            icon={"🕒"}
            href="/team"
          />
          <Tile title="Maintenance" icon={"🔧"} href="/operations" />
        </div>

        <div className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-4 items-start">
          <div className="col-span-12 lg:col-span-4">
            <Card title="Staff Overview">
              <div className="text-sm text-black/60 mb-4">
                2 active and 2 on break out of 40 total
              </div>

              <div className="space-y-4">
                {staff.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span
                      className={[
                        "h-3 w-3 rounded-full",
                        s.status === "active"
                          ? "bg-green-500"
                          : "bg-yellow-400",
                      ].join(" ")}
                    />
                    <div className="h-10 w-10 rounded-full bg-black/10 border border-black/10" />
                    <div className="text-base font-medium text-black">
                      {s.name}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <Card title="Scheduled vs Actual hours worked">
              <ChartPlaceholder height={230} />
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-3 lg:row-span-2 flex flex-col gap-6">
            <ActionButton icon="📅" label="Edit Schedule" href="/operations" />
            <ActionButton icon="⚠️" label="View issues" href="/operations" />

            <Card title="Today’s Events">
              <div className="space-y-2 text-sm text-black/70">
                {events.map((e) => (
                  <div key={e} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Employees on leave">
              <div className="space-y-4">
                {onLeave.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#FBC02D]/30 border border-black/10" />
                      <div>
                        <div className="text-base font-medium text-black">
                          {p.name}
                        </div>
                        <div className="text-xs text-black/50">{p.role}</div>
                      </div>
                    </div>
                    <span className="text-black/40 text-xl">›</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-9">
            <Card title="Performance Overview">
              <div className="grid grid-cols-2 text-sm text-black/60 border-b border-black/10 pb-2">
                <span>Employee Name</span>
                <span className="text-right">Task Completion Rate</span>
              </div>

              <div className="mt-4 space-y-4">
                {performance.map((r) => (
                  <div key={r.name} className="grid grid-cols-2">
                    <span className="text-base text-black">{r.name}</span>
                    <span className="text-base text-black text-right">
                      {r.rate}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-9">
            <Card title="Employees">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-[#2E90FA]">15 part Time</span>
                <span className="text-[#22C55E]">20 Full Time</span>
                <span className="text-[#EF4444]">5 Temporary</span>
              </div>
              <ChartPlaceholder height={230} />
            </Card>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}