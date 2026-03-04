import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, teamSettings } from "@/lib/db/schema";
import { ShieldAlert } from "lucide-react";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
        <p className="mt-1 text-sm text-slate-500">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  const allUsers = await db.select().from(users).orderBy(users.createdAt);

  const settings = await db.select().from(teamSettings).limit(1);
  const team = settings[0] ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your team settings and user roles.
        </p>
      </div>

      <SettingsClient
        initialUsers={allUsers}
        initialInviteCode={team?.inviteCode ?? ""}
        initialApiKey={team?.anthropicApiKey ?? ""}
        teamId={team?.id ?? null}
      />
    </div>
  );
}
