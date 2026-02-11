import ManagerLayout from "./layouts/ManagerLayout";
import { Link } from "expo-router";

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border rounded-lg p-6 hover:shadow-md transition"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
      <p className="text-blue-600 mt-4">Open →</p>
    </Link>
  );
}

export default function Dashboard() {
  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back. Use the quick links below to manage reports,
            communication, and settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            title="Analyze Reports"
            desc="View labour cost dashboard and performance metrics."
            href="/analyze-reports"
          />
          <Card
            title="Communication"
            desc="Create announcements and view direct messages."
            href="/communication"
          />
          <Card
            title="Settings"
            desc="Update profile, security, and notification preferences."
            href="/settings"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">Today’s Snapshot</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded p-4 text-center">
                <p className="text-sm text-gray-600">Open Requests</p>
                <p className="text-xl font-semibold">3</p>
              </div>
              <div className="border rounded p-4 text-center">
                <p className="text-sm text-gray-600">Employees</p>
                <p className="text-xl font-semibold">24</p>
              </div>
              <div className="border rounded p-4 text-center">
                <p className="text-sm text-gray-600">Teams</p>
                <p className="text-xl font-semibold">4</p>
              </div>
              <div className="border rounded p-4 text-center">
                <p className="text-sm text-gray-600">Alerts</p>
                <p className="text-xl font-semibold">1</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
            <ul className="space-y-3 text-sm">
              <li className="border rounded p-3 bg-gray-50">
                Approval request received from <b>Team 2</b>
              </li>
              <li className="border rounded p-3 bg-gray-50">
                Announcement draft saved
              </li>
              <li className="border rounded p-3 bg-gray-50">
                Notifications updated
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
