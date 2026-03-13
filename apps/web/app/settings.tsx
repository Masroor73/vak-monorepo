import ManagerLayout from "./layouts/ManagerLayout";
import DarkPage from "./components/DarkPage";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function Settings() {
  useAuthGuard();
//web/app/settings.tsx
import { useRef, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";
import { useAuthGuard } from "../hooks/useAuthGuard";

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
  useAuthGuard();
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
      <DarkPage
        title="System Settings"
        subtitle="Configure application preferences."
      >

        <div className="space-y-4">

          <div className="flex justify-between bg-auth-input border border-auth-border px-4 py-3">
            <span>Email Notifications</span>
            <input type="checkbox" />
          </div>

          <div className="flex justify-between bg-auth-input border border-auth-border px-4 py-3">
            <span>Maintenance Mode</span>
            <input type="checkbox" />
          </div>

        </div>

      </DarkPage>
    </ManagerLayout>
  );
}
