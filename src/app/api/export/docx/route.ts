import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateProposalDocx } from '@/lib/export/docx';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dealId = request.nextUrl.searchParams.get('dealId');
    if (!dealId) {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
    }

    const [deal] = await db.select().from(deals).where(eq(deals.id, dealId));
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (!deal.pricingResult) {
      return NextResponse.json(
        { error: 'Pricing results must be generated before exporting' },
        { status: 400 }
      );
    }

    const buffer = await generateProposalDocx(deal);
    const filename = `Shift4_Proposal_${deal.merchantName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('DOCX export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX' },
      { status: 500 }
    );
  }
}
