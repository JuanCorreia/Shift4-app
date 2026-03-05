import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Try Supabase upload if configured
    let url = '';
    let path = '';

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const hasSupabase = supabaseUrl && !supabaseUrl.includes('placeholder') &&
                        supabaseKey && supabaseKey !== 'placeholder';

    if (hasSupabase) {
      try {
        const { uploadStatement } = await import('@/lib/supabase/storage');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await uploadStatement(buffer, file.name);
        url = result.url;
        path = result.path;
      } catch (err) {
        console.warn('Supabase upload failed, continuing without storage:', err);
      }
    }

    // Return success even without storage — the client already has the base64
    return NextResponse.json({
      url: url || `local://${file.name}`,
      path: path || file.name,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
