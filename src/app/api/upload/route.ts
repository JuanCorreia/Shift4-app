import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { canEditDeals } from '@/lib/auth/permissions';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const PDF_MAGIC = Buffer.from('%PDF-');

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canEditDeals(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 20MB limit' },
        { status: 400 }
      );
    }

    // file.type is client-controlled — verify the PDF signature server-side
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length < PDF_MAGIC.length || !buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
      return NextResponse.json(
        { error: 'File is not a valid PDF' },
        { status: 400 }
      );
    }

    // Try Supabase upload if configured
    let path = '';

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const hasSupabase = supabaseUrl && !supabaseUrl.includes('placeholder') &&
                        supabaseKey && supabaseKey !== 'placeholder';

    if (hasSupabase) {
      try {
        const { uploadStatement } = await import('@/lib/supabase/storage');
        const result = await uploadStatement(buffer, session.partnerId ?? 'super_admin');
        path = result.path;
      } catch (err) {
        console.warn('Supabase upload failed, continuing without storage:', err);
      }
    }

    // Return success even without storage — the client already has the base64.
    // The URL is an authenticated, partner-scoped route that redirects to a
    // short-lived signed URL; the storage object itself is never public.
    return NextResponse.json({
      url: path ? `/api/statements?path=${encodeURIComponent(path)}` : `local://${file.name}`,
      path: path || file.name,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
