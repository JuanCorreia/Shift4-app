import { getSupabase } from './client';

const BUCKET = 'statements';

export async function uploadStatement(
  file: Buffer,
  filename: string
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${timestamp}-${safeName}`;

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = getSupabase().storage
    .from(BUCKET)
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path,
  };
}

export async function getStatementUrl(path: string): Promise<string> {
  const { data, error } = await getSupabase().storage
    .from(BUCKET)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to get signed URL: ${error?.message || 'Unknown error'}`);
  }

  return data.signedUrl;
}
