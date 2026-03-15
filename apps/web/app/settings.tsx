import { useEffect, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import Toggle from "./components/Toggle";

export default function SettingsPage() {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /* ---------------- LOAD SETTINGS ---------------- */

  useEffect(() => {
    if (!user) return;
    loadSettings();
  }, [user]);

  async function loadSettings() {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!data) return;

    setDisplayName(data.display_name || "");
    setEmail(data.email || user.email || "");
    setAvatarUrl(data.avatar_url || "");
    setDarkMode(data.dark_mode || false);
    setEmailNotifications(data.email_notifications || false);
  }

  /* ---------------- DARK MODE ---------------- */

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  /* ---------------- UPLOAD AVATAR ---------------- */

  async function uploadAvatar(e: any) {
    if (!user) return;

    const file = e.target.files[0];
    if (!file) return;

    const filePath = `avatars/${user.id}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setAvatarUrl(data.publicUrl);

    await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);
  }

  /* ---------------- SAVE SETTINGS ---------------- */

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      if (password) {
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) throw error;
      }

      await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          dark_mode: darkMode,
          email_notifications: emailNotifications,
        })
        .eq("id", user.id);

      setMessage("Settings saved successfully.");
    } catch (err: any) {
      setMessage(err.message);
    }

    setSaving(false);
  }

  return (
    <ManagerLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* PAGE HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">
            Manage your account and application preferences
          </p>
        </div>

        {/* PROFILE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-7 space-y-6">

          <div className="flex items-center gap-3">
            <Ionicons name="person-outline" size={20} />
            <h2 className="font-semibold text-gray-900">Profile</h2>
          </div>

          <div className="flex items-center gap-6">

            <div className="relative w-20 h-20">

              <img
                src={
                  avatarUrl ||
                  "https://ui-avatars.com/api/?name=" + displayName
                }
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
              />

              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer shadow">

                <Ionicons name="camera" size={14} />

                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                />

              </label>

            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm text-gray-500">Display Name</label>

              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

            </div>

            <div>
              <label className="text-sm text-gray-500">Email</label>

              <input
                disabled
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-100"
                value={email}
              />

            </div>

          </div>

        </div>

        {/* SECURITY */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-7 space-y-5">

          <div className="flex items-center gap-3">
            <Ionicons name="lock-closed-outline" size={20} />
            <h2 className="font-semibold text-gray-900">Security</h2>
          </div>

          <div>
            <label className="text-sm text-gray-500">Change Password</label>

            <input
              type="password"
              placeholder="New password"
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

          </div>

        </div>

        {/* PREFERENCES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-7 space-y-5">

          <div className="flex items-center gap-3">
            <Ionicons name="settings-outline" size={20} />
            <h2 className="font-semibold text-gray-900">Preferences</h2>
          </div>

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-900">
                Email Notifications
              </p>

              <p className="text-xs text-gray-500">
                Receive email alerts for important events
              </p>
            </div>

            <Toggle
              value={emailNotifications}
              onChange={(v) => setEmailNotifications(v)}
            />

          </div>

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-900">
                Dark Mode
              </p>

              <p className="text-xs text-gray-500">
                Toggle dark interface theme
              </p>
            </div>

            <Toggle
              value={darkMode}
              onChange={(v) => setDarkMode(v)}
            />

          </div>

        </div>

        {/* SAVE SECTION */}
        <div className="flex items-center justify-between">

          <div className="text-sm text-gray-500">{message}</div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>

      </div>
    </ManagerLayout>
  );
}