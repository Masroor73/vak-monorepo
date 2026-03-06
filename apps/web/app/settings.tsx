import { useRef, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-7 rounded-full relative ${
        value ? "bg-green-500" : "bg-gray-300"
      }`}
      type="button"
    >
      <span
        className={`h-6 w-6 bg-white rounded-full absolute top-0.5 transition-all ${
          value ? "left-6" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [twoFA, setTwoFA] = useState(true);

  const [shiftChange, setShiftChange] = useState(true);
  const [timesheet, setTimesheet] = useState(true);
  const [maintenance, setMaintenance] = useState(true);
  const [announcements, setAnnouncements] = useState(true);
  const [issuesReported, setIssuesReported] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }

    // Optional size limit
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large (max 5MB).");
      e.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    setAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-6">Profile Information</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="flex flex-col items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelected}
              />

              <div className="h-28 w-28 rounded-full bg-gray-200 flex items-center justify-center text-3xl overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "👤"
                )}
              </div>

              <div className="flex gap-3">
                <button className="border rounded px-4 py-2" onClick={handlePickAvatar} type="button">
                  Edit
                </button>
                <button className="bg-blue-500 text-white rounded px-4 py-2" type="button">
                  Save
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <p className="text-sm mb-1">Full Name</p>
                <input className="w-full border rounded px-3 py-2" />
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm mb-1">Email Address</p>
                <input className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <p className="text-sm mb-1">Phone</p>
                <input className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <p className="text-sm mb-1">Role</p>
                <select className="w-full border rounded px-3 py-2">
                  <option>Manager</option>
                  <option>Employee</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lower cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">Security</h3>

            <div className="border rounded p-4">
              <p className="text-sm text-gray-600 mb-2">Email</p>
              <input className="w-full border rounded px-3 py-2 mb-3" />

              <div className="flex gap-3">
                <button className="border rounded px-4 py-2" type="button">
                  Cancel
                </button>
                <button className="bg-blue-500 text-white rounded px-4 py-2" type="button">
                  Reset Password
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <p className="font-medium">Two-Fact Authentication</p>
              <Toggle value={twoFA} onChange={setTwoFA} />
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">
              Notifications Settings
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p>Shift Change Requests</p>
                <Toggle value={shiftChange} onChange={setShiftChange} />
              </div>

              <div className="flex justify-between items-center">
                <p>Timesheet Approvals</p>
                <Toggle value={timesheet} onChange={setTimesheet} />
              </div>

              <div className="flex justify-between items-center">
                <p>Maintenance Updates</p>
                <Toggle value={maintenance} onChange={setMaintenance} />
              </div>

              <div className="flex justify-between items-center">
                <p>Announcements</p>
                <Toggle value={announcements} onChange={setAnnouncements} />
              </div>

              <div className="flex justify-between items-center">
                <p>Issues Reported</p>
                <Toggle value={issuesReported} onChange={setIssuesReported} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}