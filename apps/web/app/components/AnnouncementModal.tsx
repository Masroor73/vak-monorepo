import { useState } from "react";
import { supabase } from "../../lib/supabase"
import { Ionicons } from "@expo/vector-icons";

export default function AnnouncementModal({ open, onClose }: any) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");

  if (!open) return null;

  async function sendAnnouncement() {
    await supabase.from("announcements").insert({
      title,
      message,
      target,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl w-[520px] p-6 shadow-xl">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Announcement</h2>
          <button onClick={onClose}>
            <Ionicons name="close" size={20} />
          </button>
        </div>

        <div className="space-y-4">

          <div>
            <label className="text-xs text-gray-500">TITLE</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">MESSAGE</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 mt-1"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">

            <button
              onClick={() => setTarget("all")}
              className={`border rounded-lg p-2 ${
                target === "all" ? "bg-blue-50 border-blue-500" : ""
              }`}
            >
              All Staff
            </button>

            <button
              onClick={() => setTarget("employees")}
              className={`border rounded-lg p-2 ${
                target === "employees" ? "bg-blue-50 border-blue-500" : ""
              }`}
            >
              Employees Only
            </button>

            <button
              onClick={() => setTarget("managers")}
              className={`border rounded-lg p-2 ${
                target === "managers" ? "bg-blue-50 border-blue-500" : ""
              }`}
            >
              Managers Only
            </button>

            <button
              onClick={() => setTarget("specific")}
              className={`border rounded-lg p-2 ${
                target === "specific" ? "bg-blue-50 border-blue-500" : ""
              }`}
            >
              Specific Employee
            </button>

          </div>

          <div className="flex justify-end gap-2 pt-4">

            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={sendAnnouncement}
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              Send Announcement
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}