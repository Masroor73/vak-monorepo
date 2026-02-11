import { useMemo, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";

const ACCENT = "#62CCEF";

type Task = { id: string; title: string; done: boolean };

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
    <div className={`bg-white border rounded-xl p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-center mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Donut({
  size = 260,
  thickness = 70,
  segments,
}: {
  size?: number;
  thickness?: number;
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const conic = useMemo(() => {
    let acc = 0;
    const stops = segments
      .map((s) => {
        const start = (acc / total) * 100;
        acc += s.value;
        const end = (acc / total) * 100;
        return `${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
      })
      .join(", ");
    return `conic-gradient(${stops})`;
  }, [segments, total]);

  return (
    <div
      className="mx-auto rounded-full relative"
      style={{
        width: size,
        height: size,
        background: conic,
      }}
    >
      <div
        className="absolute rounded-full bg-white"
        style={{
          width: size - thickness,
          height: size - thickness,
          top: thickness / 2,
          left: thickness / 2,
        }}
      />
    </div>
  );
}

export default function Operations() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Inform Staff about inventory", done: true },
    { id: "2", title: "", done: false },
    { id: "3", title: "", done: false },
  ]);

  const completed = tasks.filter((t) => t.done).length;

  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(100);

  const wastePct = Math.min(100, Math.round((count / Math.max(1, target)) * 100));

  const segments = [
    { label: "Damaged", value: 70, color: "#FFB3AB" },
    { label: "Expired", value: 30, color: "#7EC8FF" },
  ];

  return (
    <ManagerLayout>
      <div
        className="rounded-2xl border-2 p-6"
        style={{ borderColor: ACCENT, backgroundColor: "#D9D9D9" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <Card title="Daily Checklist Progress">
              <div className="border-t-4 border-black mb-4" />

              <div className="space-y-3 text-sm">
                {tasks.map((t, idx) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between py-2 ${
                      idx === tasks.length - 1 ? "" : "border-b"
                    }`}
                  >
                    <label className="flex items-center gap-3 w-full">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() =>
                          setTasks((prev) =>
                            prev.map((x) =>
                              x.id === t.id ? { ...x, done: !x.done } : x
                            )
                          )
                        }
                      />
                      <input
                        value={t.title}
                        onChange={(e) =>
                          setTasks((prev) =>
                            prev.map((x) =>
                              x.id === t.id ? { ...x, title: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Title..."
                        className="w-full outline-none text-sm"
                      />
                    </label>

                    <span className="text-gray-500 pl-2">≡</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mt-6">
                <span>
                  Completed {completed} of {tasks.length}
                </span>
                <button
                  className="text-gray-800"
                  onClick={() =>
                    setTasks((prev) => [
                      ...prev,
                      { id: String(Date.now()), title: "", done: false },
                    ])
                  }
                >
                  + Add task
                </button>
              </div>
            </Card>

            <Card title="Waste Tracking">
              <div className="border rounded-md p-3 bg-purple-100">
                <div className="text-center text-xs font-semibold">{wastePct}%</div>
                <div className="h-2 bg-purple-200 rounded mt-2">
                  <div
                    className="h-2 bg-purple-500 rounded"
                    style={{ width: `${wastePct}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-16">Count:</span>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-32"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16">Target:</span>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-32"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <Card title="Maintenance Log" className="flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <Donut segments={segments} />
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <span>Damaged - 70%</span>
              <span>Expired - 30%</span>
            </div>

            <div className="mt-6 h-28 bg-gray-100 rounded-xl" />
          </Card>
        </div>
      </div>
    </ManagerLayout>
  );
}
