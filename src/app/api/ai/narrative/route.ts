import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { partnerFilter } from '@/lib/db/helpers';
import { generateNarrative, dealToNarrativeInput } from '@/lib/ai/narrative';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = rateLimit(session.userId, 10, 60000);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { dealId } = body;

    if (!dealId || typeof dealId !== 'string') {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
    }

    const pf = partnerFilter(session);
    const conditions = pf ? and(eq(deals.id, dealId), pf) : eq(deals.id, dealId);
    const [deal] = await db.select().from(deals).where(conditions);
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (!deal.pricingResult) {
      return NextResponse.json(
        { error: 'Pricing results must be generated before creating a narrative' },
        { status: 400 }
      );
    }

    const input = dealToNarrativeInput(deal);
    const narrative = await generateNarrative(input);

    await db
      .update(deals)
      .set({ narrative, updatedAt: new Date() })
      .where(eq(deals.id, dealId));

    return NextResponse.json({ narrative });
  } catch (error) {
    console.error('Narrative generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative' },
      { status: 500 }
    );
  }
}
