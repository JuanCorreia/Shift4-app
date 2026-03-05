"use client";

import { useState } from "react";
import { ROLES } from "@/lib/constants";
import { Save, Users, Key, Brain, Eye, EyeOff } from "lucide-react";
import type { User } from "@/lib/db/schema";

interface SettingsClientProps {
  initialUsers: User[];
  initialInviteCode: string;
  initialApiKeySet: boolean;
  teamId: string | null;
}

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
  const [userRoles, setUserRoles] = useState<Record<string, string>>(
    Object.fromEntries(initialUsers.map((u) => [u.id, u.role]))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50">
            <Users className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Team Members
            </h2>
            <p className="text-sm text-slate-500">
              {initialUsers.length} member
              {initialUsers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {initialUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
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
            </div>
          ))}
          {initialUsers.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No team members yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
