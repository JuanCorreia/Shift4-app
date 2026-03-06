"use client";

import { useState } from "react";
import { ROLES } from "@/lib/constants";
import {
  Save,
  Users,
  Key,
  Brain,
  Eye,
  EyeOff,
  UserPlus,
  Pencil,
  X,
  Shield,
  Power,
} from "lucide-react";
import type { User } from "@/lib/db/schema";

interface SettingsClientProps {
  initialUsers: User[];
  initialInviteCode: string;
  initialApiKeySet: boolean;
  teamId: string | null;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    "Full system access",
    "Manage all partners",
    "Create/edit/deactivate users across partners",
    "View all deals globally",
  ],
  admin: [
    "Manage team settings (invite code, API key)",
    "Create/edit/deactivate users in own partner",
    "Change user roles",
    "View all deals in own partner",
    "Export deal data (CSV, PDF)",
  ],
  analyst: [
    "Create and edit deals",
    "Run pricing engine",
    "Generate proposals",
    "View own partner deals",
  ],
  viewer: [
    "View deals (read-only)",
    "View reports",
    "No create/edit permissions",
  ],
};

export default function SettingsClient({
  initialUsers,
  initialInviteCode,
  initialApiKeySet,
  teamId,
}: SettingsClientProps) {
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState("");
  const [userList, setUserList] = useState<User[]>(initialUsers);
  const [userRoles, setUserRoles] = useState<Record<string, string>>(
    Object.fromEntries(initialUsers.map((u) => [u.id, u.role]))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("analyst");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit user modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  async function handleSaveInviteCode() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/invite-code", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode, teamId }),
      });
      if (res.ok) {
        setMessage("Invite code updated.");
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save.");
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveApiKey() {
    setSavingApiKey(true);
    setApiKeyMessage("");
    try {
      const res = await fetch("/api/settings/api-key", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, teamId }),
      });
      if (res.ok) {
        setApiKeyMessage("API key updated.");
      } else {
        const data = await res.json();
        setApiKeyMessage(data.error || "Failed to save.");
      }
    } catch {
      setApiKeyMessage("Network error.");
    } finally {
      setSavingApiKey(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
    try {
      const res = await fetch("/api/settings/user-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) {
        setUserRoles((prev) => ({
          ...prev,
          [userId]: initialUsers.find((u) => u.id === userId)?.role ?? "viewer",
        }));
      }
    } catch {
      setUserRoles((prev) => ({
        ...prev,
        [userId]: initialUsers.find((u) => u.id === userId)?.role ?? "viewer",
      }));
    }
  }

  async function handleCreateUser() {
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUserList((prev) => [...prev, data.user]);
        setUserRoles((prev) => ({ ...prev, [data.user.id]: data.user.role }));
        setShowCreateModal(false);
        setNewName("");
        setNewEmail("");
        setNewRole("analyst");
      } else {
        setCreateError(data.error || "Failed to create user.");
      }
    } catch {
      setCreateError("Network error.");
    } finally {
      setCreating(false);
    }
  }

  function openEditModal(user: User) {
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditActive(user.active);
    setEditError("");
  }

  async function handleEditUser() {
    if (!editUser) return;
    setEditing(true);
    setEditError("");
    try {
      const res = await fetch(`/api/settings/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          active: editActive,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserList((prev) =>
          prev.map((u) =>
            u.id === editUser.id
              ? { ...u, name: editName, email: editEmail, role: editRole as User["role"], active: editActive }
              : u
          )
        );
        setUserRoles((prev) => ({ ...prev, [editUser.id]: editRole }));
        setEditUser(null);
      } else {
        setEditError(data.error || "Failed to update user.");
      }
    } catch {
      setEditError("Network error.");
    } finally {
      setEditing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite code section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50">
            <Key className="h-4 w-4 text-emerald-800" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Team Invite Code
            </h2>
            <p className="text-sm text-slate-500">
              Share this code with new team members.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="Enter invite code"
          />
          <button
            onClick={handleSaveInviteCode}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {message && (
          <p className="mt-2 text-sm text-emerald-600">{message}</p>
        )}
      </div>

      {/* API Key section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50">
            <Brain className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Anthropic API Key
            </h2>
            <p className="text-sm text-slate-500">
              Required for AI-powered statement analysis and proposal generation.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
              placeholder={initialApiKeySet ? "Key is set — enter new key to replace" : "sk-ant-..."}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <button
            onClick={handleSaveApiKey}
            disabled={savingApiKey}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Save className="h-4 w-4" />
            {savingApiKey ? "Saving..." : "Save"}
          </button>
        </div>
        {apiKeyMessage && (
          <p className="mt-2 text-sm text-emerald-600">{apiKeyMessage}</p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Get your API key from{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            console.anthropic.com
          </a>
          . Falls back to the ANTHROPIC_API_KEY environment variable if not set.
        </p>
      </div>

      {/* Users section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50">
              <Users className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Team Members
              </h2>
              <p className="text-sm text-slate-500">
                {userList.length} member
                {userList.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-800 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {userList.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between px-6 py-4 ${!user.active ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold ${user.active ? "bg-slate-100 text-slate-600" : "bg-red-50 text-red-400"}`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {user.name}
                    </p>
                    {!user.active && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={userRoles[user.id] ?? user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {Object.entries(ROLES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => openEditModal(user)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit user"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {userList.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No team members yet.
            </div>
          )}
        </div>
      </div>

      {/* Role permissions reference */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Role Permissions
            </h2>
            <p className="text-sm text-slate-500">
              What each role can do in the system.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
            <div key={role} className="border border-slate-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-2 capitalize">
                {ROLES[role as keyof typeof ROLES] ?? role}
              </h3>
              <ul className="space-y-1">
                {perms.map((p) => (
                  <li key={p} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">&#x2022;</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Add User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {Object.entries(ROLES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating || !newName.trim() || !newEmail.includes("@")}
                className="px-4 py-2 bg-emerald-800 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Edit User</h2>
              <button
                onClick={() => setEditUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {Object.entries(ROLES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Power className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Account Active</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditActive(!editActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editActive ? "bg-emerald-600" : "bg-slate-300"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editActive ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
              {editError && (
                <p className="text-sm text-red-600">{editError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                disabled={editing || !editName.trim() || !editEmail.includes("@")}
                className="px-4 py-2 bg-emerald-800 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {editing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
