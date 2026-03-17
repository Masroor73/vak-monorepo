//web/app/user-management.tsx
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import ManagerLayout from "./layouts/ManagerLayout";
import { Profile } from "@vak/contract";
import Toggle from "./components/Toggle";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function UserManagement() {
  useAuthGuard();
  const { profile: currentUser, isManager, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingApproval, setTogglingApproval] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isManager) {
      router.replace("/");
      return;
    }
    fetchUsers();
  }, [authLoading, isManager]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (!error && data) {
      setUsers(
        data.map((row) => ({
          ...row,
          role: row.role as Profile["role"],
        })) as Profile[]
      );
    }
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ role: editingUser.role })
      .eq("id", editingUser.id);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? editingUser : u))
      );
      setEditingUser(null);
    }
    setSaving(false);
  };

  const handleToggleApproval = async (user: Profile) => {
    setTogglingApproval(user.id);

    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: !user.is_approved })
      .eq("id", user.id);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_approved: !u.is_approved } : u
        )
      );
    }
    setTogglingApproval(null);
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const assignableRoles: Profile["role"][] = isAdmin
    ? ["OWNER", "MANAGER", "EMPLOYEE"]
    : ["MANAGER", "EMPLOYEE"];

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} total users</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row gap-3">
          <input
            className="border rounded-full px-4 py-2 text-sm flex-1"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border rounded-full px-4 py-2 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="OWNER">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="px-6 py-16 text-center text-gray-400 text-sm">
              Loading users...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Approved</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((user) => {
                  // Prevent manager from editing themselves or anyone with a higher role
                  const isSelf = user.id === currentUser?.id;
                  const isHigherRole =
                    user.role === "OWNER" && !isAdmin;
                  const canEdit = !isSelf && !isHigherRole;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium">{user.full_name ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === "OWNER"
                              ? "bg-purple-100 text-purple-700"
                              : user.role === "MANAGER"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role === "OWNER"
                            ? "Owner"
                            : user.role === "MANAGER"
                            ? "Manager"
                            : "Employee"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {togglingApproval === user.id ? (
                          <span className="text-xs text-gray-400">Saving...</span>
                        ) : (
                          <Toggle
                            value={user.is_approved}
                            onChange={() => handleToggleApproval(user)}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-left">
                        {canEdit ? (
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Edit
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">
                            {isSelf ? "You" : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="text-lg font-semibold">Edit User</h2>
            <div>
              <p className="text-sm mb-1">Name</p>
              <p className="text-sm font-medium text-gray-800">
                {editingUser.full_name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-sm mb-1">Email</p>
              <input
                className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed"
                value={editingUser.email}
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
            </div>
            <div>
              <p className="text-sm mb-1">Role</p>
              <select
                className="w-full border rounded px-3 py-2"
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    role: e.target.value as Profile["role"],
                  })
                }
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 border rounded px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}