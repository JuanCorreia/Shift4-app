import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { parseStatement } from '@/lib/ai/ocr';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = rateLimit(session.userId, 10, 60000);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();

    let pdfBase64: string;

    if (body.pdfBase64) {
      pdfBase64 = body.pdfBase64;
    } else {
      return NextResponse.json(
        { error: 'pdfBase64 is required' },
        { status: 400 }
      );
    }

    // Validate base64 is not empty
    if (!pdfBase64 || pdfBase64.length === 0) {
      return NextResponse.json(
        { error: 'Empty PDF data' },
        { status: 400 }
      );
    }

    const result = await parseStatement(pdfBase64, session.partnerId ?? undefined);

    return NextResponse.json(result);
  } catch (err) {
    console.error('OCR error:', err);

    const message = err instanceof Error ? err.message : 'OCR processing failed';
    const status = message.includes('401') ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
