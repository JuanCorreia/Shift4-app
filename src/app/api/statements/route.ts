import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getStatementUrl } from '@/lib/supabase/storage';

/**
 * Serve an uploaded statement PDF to an authenticated user of the owning
 * partner via a short-lived signed URL. Objects are stored under
 * `<partnerId>/<uuid>.pdf`, so the prefix is the tenancy check.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path') || '';

  // Only allow the exact shape we generate: <prefix>/<uuid>.pdf
  if (!/^[A-Za-z0-9_-]+\/[0-9a-f-]{36}\.pdf$/.test(path)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const [prefix] = path.split('/');
  if (session.role !== 'super_admin' && prefix !== session.partnerId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const signedUrl = await getStatementUrl(path);
    const response = NextResponse.redirect(signedUrl, 302);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (err) {
    console.error('Statement URL error:', err);
    return NextResponse.json({ error: 'Statement not available' }, { status: 404 });
  }
}
