import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals, escalations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { partnerFilter } from '@/lib/db/helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dealId = params.id;

  // Verify deal belongs to user's partner
  const pf = partnerFilter(session);
  const dealConditions = pf ? and(eq(deals.id, dealId), pf) : eq(deals.id, dealId);
  const [deal] = await db.select({ id: deals.id }).from(deals).where(dealConditions);
  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(escalations)
    .where(eq(escalations.dealId, dealId))
    .orderBy(escalations.createdAt);

  return NextResponse.json(rows);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify deal belongs to user's partner
  const pf = partnerFilter(session);
  const dealConditions = pf ? and(eq(deals.id, params.id), pf) : eq(deals.id, params.id);
  const [deal] = await db.select({ id: deals.id }).from(deals).where(dealConditions);
  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  const body = await request.json();
  const { escalationId, resolved } = body;

  if (!escalationId || resolved !== true) {
    return NextResponse.json(
      { error: 'Missing escalationId or resolved must be true' },
      { status: 400 }
    );
  }

  // Verify the escalation belongs to this deal
  const [existing] = await db
    .select()
    .from(escalations)
    .where(
      and(eq(escalations.id, escalationId), eq(escalations.dealId, params.id))
    );

  if (!existing) {
    return NextResponse.json({ error: 'Escalation not found' }, { status: 404 });
  }

  await db
    .update(escalations)
    .set({
      resolved: true,
      resolvedBy: session.userId,
      resolvedAt: new Date(),
    })
    .where(eq(escalations.id, escalationId));

  return NextResponse.json({ success: true });
}
