import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export async function logAuditEvent(params: {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await db.insert(auditLog).values({
      userId: params.userId || undefined,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ip: params.ip,
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
