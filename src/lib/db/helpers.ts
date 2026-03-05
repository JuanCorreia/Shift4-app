import { eq, SQL } from "drizzle-orm";
import { deals } from "./schema";
import type { SessionPayload } from "@/lib/auth/session";

/**
 * Returns a partner filter condition for deal queries.
 * Super admins see all deals (no filter); everyone else is scoped to their partner.
 */
export function partnerFilter(session: SessionPayload): SQL | undefined {
  if (session.role === "super_admin") return undefined;
  if (!session.partnerId) throw new Error("User has no partner assigned");
  return eq(deals.partnerId, session.partnerId);
}
