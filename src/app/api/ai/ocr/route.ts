import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { parseStatement } from '@/lib/ai/ocr';
import { rateLimit } from '@/lib/rate-limit';
import { canEditDeals } from '@/lib/auth/permissions';

// 20MB upload limit expressed in base64 characters (+ small margin)
const MAX_PDF_BASE64 = Math.ceil((20 * 1024 * 1024 * 4) / 3) + 1024;

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();

    let pdfBase64: string;

    if (typeof body.pdfBase64 === 'string' && body.pdfBase64.length > 0) {
      pdfBase64 = body.pdfBase64;
    } else {
      return NextResponse.json(
        { error: 'pdfBase64 is required' },
        { status: 400 }
      );
    }

    if (pdfBase64.length > MAX_PDF_BASE64) {
      return NextResponse.json(
        { error: 'PDF exceeds the 20MB limit' },
        { status: 413 }
      );
    }

    const result = await parseStatement(pdfBase64, session.partnerId ?? undefined);

    return NextResponse.json(result);
  } catch (err) {
    console.error('OCR error:', err);

    // Do not echo provider error details (may contain request ids / key hints)
    const message = err instanceof Error ? err.message : '';
    const isAuth = message.includes('401') || /api key/i.test(message);

    return NextResponse.json(
      { error: isAuth ? 'AI provider rejected the API key. Check Settings.' : 'OCR processing failed' },
      { status: isAuth ? 502 : 500 }
    );
  }
}
