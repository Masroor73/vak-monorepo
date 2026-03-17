import { useEffect, useState } from "react";
import ManagerLayout from "./layouts/ManagerLayout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import Toggle from "./components/Toggle";

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);

  const [deletePassword, setDeletePassword] = useState("");

  const [editMode, setEditMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /* LOAD PROFILE */

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  async function loadProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    if (!data) return;

    setDisplayName(data.full_name || "");
    setEmail(data.email || "");
    setPhone(data.phone_number || "");
    setAvatarUrl(data.avatar_url || "");
  }

  /* VALIDATION */

  function validateName(name: string) {
    const regex = /^[a-zA-Z\s]{2,40}$/;
    return regex.test(name);
  }

  function validatePhone(phone: string) {
    const regex = /^[0-9]{7,15}$/;
    return regex.test(phone);
  }

  function validateEmail(email: string) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /* AVATAR UPLOAD */

  async function uploadAvatar(e: any) {
    if (!user) return;

    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true
      });

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const newAvatarUrl = data.publicUrl;

    setAvatarUrl(newAvatarUrl);

    await supabase
      .from("profiles")
      .update({ avatar_url: newAvatarUrl })
      .eq("id", user.id);
  }

  /* SAVE PROFILE */

  async function saveProfile() {
    if (!user) return;

    if (!validateName(displayName)) {
      alert("Name must contain only letters.");
      return;
    }

    if (!validateEmail(email)) {
      alert("Enter a valid email.");
      return;
    }

    if (!validatePhone(phone)) {
      alert("Contact number must contain only digits.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await supabase
        .from("profiles")
        .update({
          full_name: displayName,
          email: email,
          phone_number: phone,
          avatar_url: avatarUrl
        })
        .eq("id", user.id);

      setMessage("Profile updated successfully.");
      setEditMode(false);
    } catch (err: any) {
      setMessage(err.message);
    }

    setSaving(false);
  }

  /* DELETE ACCOUNT */

  async function deleteAccount() {
  if (!user) return;

  if (!deletePassword) {
    setMessage("Please enter your password.");
    return;
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: deletePassword
  });

  if (authError) {
    setMessage("Incorrect password. Please try again.");
    return;
  }

  const { error: rpcError } = await supabase.rpc("delete_user_account");

  if (rpcError) {
    setMessage(rpcError.message);
    return;
  }

  await signOut();
  window.location.href = "/(public)/SignUp";
}

  return (
    <ManagerLayout>
      <div className="max-w-6xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">
            Manage your account information
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8 flex gap-10">

          <div className="flex flex-col items-center gap-4">

            <div className="relative w-32 h-32">

              <img
                src={
                  avatarUrl ||
                  "https://ui-avatars.com/api/?name=" + displayName
                }
                className="w-32 h-32 rounded-full object-cover border shadow"
              />

              <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow">

                <Ionicons name="camera" size={16} />

                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                />

              </label>

            </div>

          </div>

          <div className="flex-1 grid grid-cols-2 gap-6">

            <div>
              <label className="text-sm text-gray-500">Name</label>

              <input
                disabled={!editMode}
                className="mt-1 w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
                value={displayName}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                  setDisplayName(value);
                }}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Email</label>

              <input
                type="email"
                disabled={!editMode}
                className="mt-1 w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Contact Number</label>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={15}
                disabled={!editMode}
                className="mt-1 w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setPhone(value);
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-6">

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Email Notifications
                </p>

                <p className="text-xs text-gray-500">
                  Receive alerts for important updates
                </p>
              </div>

              <Toggle
                value={emailNotifications}
                onChange={(v) => setEmailNotifications(v)}
              />

            </div>

          </div>

        </div>

        <div className="flex items-center justify-end gap-3">

          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="bg-gray-800 text-white px-6 py-2.5 rounded-lg hover:bg-gray-900 transition"
            >
              Edit Profile
            </button>
          )}

          {editMode && (
            <button
              onClick={saveProfile}
              disabled={saving}
              className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}

        </div>

        {message && (
          <div className="text-sm text-green-600">
            {message}
          </div>
        )}

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">

          <h3 className="text-red-700 font-semibold">
            Danger Zone
          </h3>

          <p className="text-sm text-red-600">
            Permanently delete your account and all associated data.
          </p>

          <div className="max-w-sm">

            <label className="text-sm text-gray-600">
              Enter password to confirm
            </label>

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />

          </div>

          <button
            onClick={deleteAccount}
            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Permanently Delete Account
          </button>

        </div>

      </div>
    </ManagerLayout>
  );
}