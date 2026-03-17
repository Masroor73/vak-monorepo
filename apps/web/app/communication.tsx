import { useEffect, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Ionicons, Feather } from "@expo/vector-icons";

/* ================================
   TYPES
  ================================= */

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

type Recognition = {
  id: string;
  message: string;
  badge_icon: string;
  receiver_id: string;
  created_at: string;
};

type Notification = {
  id: string;
  message: string;
  user_id: string;
  title: string;
  related_entity_id: string;
  created_at: string;
};

export default function Communication() {

  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState("announcements");

  const [employees, setEmployees] = useState<Profile[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [announcements, setAnnouncements] = useState<Notification[]>([]);

  const [showHistory, setShowHistory] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [badge, setBadge] = useState("");
  const [message, setMessage] = useState("");

  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [target, setTarget] = useState("ALL");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const [textSize, setTextSize] = useState("text-sm");

  /* ================================
     INLINE FEEDBACK STATE
  ================================= */

  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [recognitionSuccess, setRecognitionSuccess] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadEmployees();
    loadRecognitions();
    loadAnnouncements();
  }, [profile?.id]);

  async function loadEmployees() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .order("full_name", { ascending: true });
    setEmployees(data || []);
  }

  async function loadRecognitions() {
    const { data } = await supabase
      .from("recognitions")
      .select("*")
      .order("created_at", { ascending: false });
    setRecognitions(data || []);
  }

  async function loadAnnouncements() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "GENERAL")
      .eq("user_id", profile?.id)
      .eq("related_entity_id", profile?.id)
      .order("created_at", { ascending: false });

    setAnnouncements(data || []);
  }

  /* ================================
     SEND RECOGNITION
  ================================= */

  async function sendRecognition() {
    setRecognitionError(null);
    setRecognitionSuccess(false);

    if (!profile?.id) {
      setRecognitionError("Session error. Please refresh and try again.");
      return;
    }

    if (!selectedEmployee || !badge || !message) {
      setRecognitionError("Please select an employee, a badge, and write a message.");
      return;
    }

    const { error } = await supabase
      .from("recognitions")
      .insert({
        sender_id: profile?.id,
        receiver_id: selectedEmployee,
        badge_icon: badge,
        message: message
      });

    if (error) {
      setRecognitionError(error.message);
      return;
    }

    setSelectedEmployee("");
    setBadge("");
    setMessage("");
    setRecognitionSuccess(true);
    setTimeout(() => setRecognitionSuccess(false), 3000);
    loadRecognitions();
  }

  /* ================================
     SEND ANNOUNCEMENT
  ================================= */

  async function sendAnnouncement() {
    setAnnouncementError(null);
    setAnnouncementSuccess(false);

    if (!profile?.id) {
      setAnnouncementError("Session error. Please refresh and try again.");
      return;
    }

    if (!announcementMessage) {
      setAnnouncementError("Please write a message before sending.");
      return;
    }

    let recipients: Profile[] = [];

    if (target === "ALL") {
      recipients = employees;
    } else if (target === "MANAGER") {
      recipients = employees.filter(e => e.role === "manager");
    } else if (target === "SPECIFIC") {
      if (selectedEmployees.length === 0) {
        setAnnouncementError("Please select at least one employee.");
        return;
      }
      recipients = employees.filter(e => selectedEmployees.includes(e.id));
    }

    if (recipients.length === 0) {
      setAnnouncementError("No recipients found for this target.");
      return;
    }

    const recipientLabel = target === "ALL"
      ? "All Employees"
      : target === "MANAGER"
      ? "Managers Only"
      : recipients.map(r => r.full_name || r.email).join(", ");

    const inserts = recipients.map(emp => ({
      user_id: emp.id,
      type: "GENERAL",
      title: recipientLabel,
      message: announcementMessage,
      related_entity_id: profile.id,
    }));

    // Sender copy so manager can read it back (RLS workaround)
    const alreadyIncluded = recipients.some(r => r.id === profile.id);
    if (!alreadyIncluded) {
      inserts.push({
        user_id: profile.id,
        type: "GENERAL",
        title: recipientLabel,
        message: announcementMessage,
        related_entity_id: profile.id,
      });
    }

    const { error } = await supabase
      .from("notifications")
      .insert(inserts);

    if (error) {
      setAnnouncementError(error.message);
      return;
    }

    setAnnouncementMessage("");
    setSelectedEmployees([]);
    setTarget("ALL");
    setAnnouncementSuccess(true);
    setTimeout(() => setAnnouncementSuccess(false), 3000);
    loadAnnouncements();
  }

  /* ================================
     DELETE SINGLE ANNOUNCEMENT
  ================================= */

  async function deleteAnnouncement(id: string) {

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      setAnnouncementError(error.message);
      return;
    }

    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  /* ================================
     DELETE ALL ANNOUNCEMENTS
  ================================= */

  async function deleteAllAnnouncements() {

    const ids = announcements.map(a => a.id);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", ids);

    if (error) {
      setAnnouncementError(error.message);
      return;
    }

    setAnnouncements([]);
  }

  function getEmployeeName(id: string) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return "Unknown";
    return emp.full_name ? emp.full_name : emp.email;
  }

  return (
    <ManagerLayout>
      <div className="space-y-6">

        <h1 className="text-2xl font-bold">Communication</h1>

        {/* TAB NAVIGATION */}

        <div className="flex gap-4 border-b pb-2">
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-3 py-1 ${activeTab === "announcements" ? "font-bold border-b-2 border-black" : ""}`}
          >
            Announcements
          </button>
          <button
            onClick={() => setActiveTab("recognition")}
            className={`px-3 py-1 ${activeTab === "recognition" ? "font-bold border-b-2 border-black" : ""}`}
          >
            Recognition
          </button>
        </div>

        {/* ================================
           ANNOUNCEMENTS TAB
        ================================= */}

        {activeTab === "announcements" && (
          <div className="space-y-4">

            <textarea
              placeholder="Write announcement..."
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <div className="flex gap-4 text-sm">
              <label>
                <input type="radio" value="ALL" checked={target === "ALL"} onChange={() => setTarget("ALL")} /> All Employees
              </label>
              <label>
                <input type="radio" value="MANAGER" checked={target === "MANAGER"} onChange={() => setTarget("MANAGER")} /> Managers Only
              </label>
              <label>
                <input type="radio" value="SPECIFIC" checked={target === "SPECIFIC"} onChange={() => setTarget("SPECIFIC")} /> Specific
              </label>
            </div>

            {target === "SPECIFIC" && (
              <select
                multiple
                value={selectedEmployees}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedEmployees(values);
                }}
                className="w-full border rounded-lg p-2 h-32"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name ? `${emp.full_name} (${emp.email})` : emp.email}
                  </option>
                ))}
              </select>
            )}

            {/* INLINE FEEDBACK */}

            {announcementError && (
              <p className="text-sm text-red-500">{announcementError}</p>
            )}

            {announcementSuccess && (
              <p className="text-sm text-green-600">Announcement sent successfully!</p>
            )}

            {/* SEND + CLEAR ALL BUTTONS */}

            <div className="flex gap-3">

              <button
                onClick={sendAnnouncement}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Feather name="send" size={16} color="white" />
                Send Announcement
              </button>

              {announcements.length > 0 && (
                <button
                  onClick={deleteAllAnnouncements}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <Ionicons name="trash" size={16} color="white" />
                  Clear All
                </button>
              )}

            </div>

            {/* ANNOUNCEMENTS LIST */}

            {announcements.map(a => (

              <div key={a.id} className="border rounded-lg p-4 space-y-1">

                <div className="flex justify-between items-start">

                  <div className="flex items-start gap-2 text-lg font-bold">
                    <Ionicons name="megaphone" size={25} color="gray" />
                    {a.message}
                  </div>

                  <button
                    onClick={() => deleteAnnouncement(a.id)}
                    className="flex items-center gap-1 text-md text-red-500 hover:text-red-600 ml-4 shrink-0"
                  >
                    <Ionicons name="close" size={20} color="red" />
                    Remove
                  </button>

                </div>

                <div className="text-md text-gray-700">
                  Sent to: {a.title}
                </div>

                <div className="text-md text-gray-700">
                  {new Date(a.created_at).toLocaleString()}
                </div>

              </div>

            ))}

          </div>
        )}

        {/* ================================
           RECOGNITION TAB
        ================================= */}

        {activeTab === "recognition" && (

          <div className="space-y-4">

            <select
              value={selectedEmployee}
              onChange={(e)=>setSelectedEmployee(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            >
              <option value="">Select Employee</option>

              {employees.map(emp=>(
                <option key={emp.id} value={emp.id}>
                  {emp.full_name ? `${emp.full_name} (${emp.email})` : emp.email}
                </option>
              ))}

            </select>

            {/* BADGE SELECTOR */}

            <div className="flex gap-3 text-xl">
              {["⭐","🏆","💪","🎯","🤝","🌟"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setBadge(emoji)}
                  className={`w-10 h-10 flex items-center justify-center border rounded-lg transition
                  ${badge === emoji ? "bg-blue-500 text-white border-blue-500" : "bg-white hover:bg-gray-100"}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* TEXT SIZE CONTROL */}

            <div>
              <label className="text-sm text-gray-600 mr-2">Text Size</label>
              <select
                onChange={(e)=>setTextSize(e.target.value)}
                className="border rounded-md px-2 py-1 text-sm"
              >
                <option value="text-sm">Small</option>
                <option value="text-base">Normal</option>
                <option value="text-lg">Large</option>
              </select>
            </div>

            {/* FIXED TEXTBOX WITH SCROLL */}

            <textarea
              placeholder="Write recognition message..."
              value={message}
              onChange={(e)=>setMessage(e.target.value)}
              rows={3}
              className={`w-full border rounded-lg p-3 resize-none overflow-y-auto max-h-24 ${textSize}`}
            />

            {/* INLINE FEEDBACK */}

            {recognitionError && (
              <p className="text-sm text-red-500">{recognitionError}</p>
            )}

            {recognitionSuccess && (
              <p className="text-sm text-green-600">Recognition sent successfully!</p>
            )}

            {/* BUTTONS */}

            <div className="flex gap-3">

              <button
                onClick={sendRecognition}
                className="w-48 bg-black text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Send Recognition
              </button>

              <button
                onClick={()=>setShowHistory(!showHistory)}
                className="w-48 bg-black text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {showHistory ? "Hide Past Recognitions" : "See Past Recognitions"}
              </button>

            </div>

            {/* HISTORY */}

            {showHistory && recognitions.map(r=>(

              <div key={r.id} className="border rounded-lg p-4 space-y-1">

                <div className="font-medium">
                  {r.badge_icon} {r.message}
                </div>

                <div className="text-xs text-gray-500">
                  Sent to: {getEmployeeName(r.receiver_id)}
                </div>

                <div className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleString()}
                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </ManagerLayout>
  );
}