import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { partnerFilter } from '@/lib/db/helpers';
import { renderProposalPdf } from '@/lib/export/pdf';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 exports per minute per user
    const { success: rateLimitOk } = rateLimit(`export-pdf:${session.userId}`, 10, 60000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many export requests. Try again in a minute.' },
        { status: 429 }
      );
    }

    const dealId = request.nextUrl.searchParams.get('dealId');
    if (!dealId) {
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
        { error: 'Pricing results must be generated before exporting' },
        { status: 400 }
      );
    }

    const template = request.nextUrl.searchParams.get('template') || undefined;
    const buffer = await renderProposalPdf(deal, template);
    const filename = `Banyan_Proposal_${deal.merchantName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
