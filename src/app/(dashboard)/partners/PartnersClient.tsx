"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, FileText, Plus, Check, Copy } from "lucide-react";

interface PartnerData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  active: boolean | null;
  userCount: number;
  dealCount: number;
  inviteCode: string | null;
  createdAt: Date;
}

interface PartnersClientProps {
  partners: PartnerData[];
}

export default function PartnersClient({ partners }: PartnersClientProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    inviteCode: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create partner");
        return;
      }

      setShowCreate(false);
      setForm({ name: "", slug: "", inviteCode: "" });
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  function copyInviteCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Partner
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Create Partner
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Acme Hotels"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                  placeholder="acme"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Invite Code (optional)
                </label>
                <input
                  type="text"
                  value={form.inviteCode}
                  onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-emerald-800 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Partner"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Partners grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-slate-500">{partner.slug}</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                  partner.active
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {partner.active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex gap-4 text-xs text-slate-500 mb-3">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {partner.userCount} users
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {partner.dealCount} deals
              </span>
            </div>

            {partner.inviteCode && (
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <code className="text-xs text-slate-600 flex-1 truncate">
                  {partner.inviteCode}
                </code>
                <button
                  onClick={() => copyInviteCode(partner.inviteCode!, partner.id)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Copy invite code"
                >
                  {copiedId === partner.id ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {partners.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            No partners yet
          </h3>
          <p className="text-sm text-slate-500">
            Create your first partner to get started.
          </p>
        </div>
      )}
    </div>
  );
}
