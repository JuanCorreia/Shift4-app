import { randomUUID } from 'crypto';
import { getSupabase } from './client';

// The bucket MUST be private. Files are only ever served through
// getStatementUrl() (short-lived signed URL) via /api/statements.
const BUCKET = 'statements';

/**
 * Upload a statement PDF under a per-tenant prefix with an unguessable name.
 * Returns the storage path only — never a public URL.
 */
export async function uploadStatement(
  file: Buffer,
  tenantPrefix: string
): Promise<{ path: string }> {
  const safePrefix = tenantPrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${safePrefix}/${randomUUID()}.pdf`;

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return { path };
}

export async function getStatementUrl(path: string): Promise<string> {
  const { data, error } = await getSupabase().storage
    .from(BUCKET)
    .createSignedUrl(path, 300); // 5 minute expiry

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to get signed URL: ${error?.message || 'Unknown error'}`);
  }

  return data.signedUrl;
}
