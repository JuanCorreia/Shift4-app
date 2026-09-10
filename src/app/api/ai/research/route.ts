import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { researchHotel } from '@/lib/ai/research';
import { rateLimit } from '@/lib/rate-limit';
import { canEditDeals } from '@/lib/auth/permissions';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canEditDeals(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = rateLimit(session.userId, 10, 60000);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const hotelName = body.hotelName?.trim();

    if (!hotelName) {
      return NextResponse.json({ error: 'hotelName is required' }, { status: 400 });
    }

    const result = await researchHotel(hotelName, session.partnerId ?? undefined);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Hotel research error:', err);
    return NextResponse.json(
      { error: 'Failed to research hotel. Please try again.' },
      { status: 500 }
    );
  }
}
