import type { SessionPayload } from "./session";

/** Roles allowed to create/edit deals, upload statements and run AI generation. */
const EDIT_ROLES = ["analyst", "admin", "super_admin"] as const;

/** Roles allowed to approve/send/archive deals, resolve escalations and manage settings. */
const ADMIN_ROLES = ["admin", "super_admin"] as const;

export function canEditDeals(session: SessionPayload): boolean {
  return (EDIT_ROLES as readonly string[]).includes(session.role);
}

export function isAdmin(session: SessionPayload): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(session.role);
}

/** Throw the same error Server Actions already use when a role check fails. */
export function requireEditRole(session: SessionPayload): void {
  if (!canEditDeals(session)) {
    throw new Error("Forbidden: read-only users cannot modify deals");
  }
}

export function requireAdminRole(session: SessionPayload): void {
  if (!isAdmin(session)) {
    throw new Error("Forbidden: admin role required");
  }
}
