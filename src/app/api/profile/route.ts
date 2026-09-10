import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession, createSession } from "@/lib/auth/session";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.string().trim().email("Invalid email address").max(255),
  emailNotifications: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, emailNotifications } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    // Check email uniqueness if changed
    if (email !== session.email) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email.trim()))
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      updatedAt: new Date(),
    };
    if (typeof emailNotifications === "boolean") {
      updateData.emailNotifications = emailNotifications;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.userId));

    // Refresh session with new data
    await createSession({
      userId: session.userId,
      email: email.trim(),
      name: name.trim(),
      role: session.role,
      partnerId: session.partnerId,
      partnerName: session.partnerName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
