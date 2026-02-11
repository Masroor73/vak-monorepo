import ManagerLayout from "../../app/layouts/ManagerLayout";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-4 w-full text-center bg-white">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function AnalyzeReports() {
  return (
    <ManagerLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Labour Cost Dashboard</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm mb-1">Start Date</p>
              <input type="date" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <p className="text-sm mb-1">End Date</p>
              <input type="date" className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
            Bar Chart Placeholder
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <StatBox label="Total Cost" value="$20,000" />
            <StatBox label="Teams" value="4" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm mb-1">Start Date</p>
              <input type="date" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <p className="text-sm mb-1">End Date</p>
              <input type="date" className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
            Line Chart Placeholder
          </div>

          <div className="mt-4 border rounded-md p-5 text-center bg-white">
            <p className="text-green-600 font-semibold">▲ 25% Increase since last month</p>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
