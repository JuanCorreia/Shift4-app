import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession, createSession } from "@/lib/auth/session";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

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

    await db
      .update(users)
      .set({
        name: name.trim(),
        email: email.trim(),
        updatedAt: new Date(),
      })
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
