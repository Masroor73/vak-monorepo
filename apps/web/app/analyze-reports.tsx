import ManagerLayout from "./layouts/ManagerLayout";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg p-4 flex flex-col items-center justify-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-xl font-semibold">{title}</h2>;
}

export default function AnalyzeReports() {
  return (
    <ManagerLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Labour Cost Dashboard */}
        <div className="bg-white border rounded-xl p-6">
          <SectionHeader title="Labour Cost Dashboard" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div>
              <p className="text-sm text-gray-600 mb-1">Start Date</p>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 bg-white"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">End Date</p>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 bg-white"
              />
            </div>
          </div>

          <div className="mt-6 h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <StatBox label="Total Cost" value="$20,000" />
            <StatBox label="Teams" value="04" />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white border rounded-xl p-6">
          <SectionHeader title="Performance Metrics" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div>
              <p className="text-sm text-gray-600 mb-1">Start Date</p>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 bg-white"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">End Date</p>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 bg-white"
              />
            </div>
          </div>

          <div className="mt-6 h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>

          <div className="mt-6 bg-white border rounded-xl p-5 text-center">
            <p className="text-green-600 font-semibold">
              ▲ 25% Increase since last month
            </p>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
