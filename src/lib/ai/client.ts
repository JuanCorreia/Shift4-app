import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { teamSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, isEncrypted } from '@/lib/crypto';

async function getApiKey(partnerId?: string): Promise<string> {
  // Try DB first, scoped to partner
  try {
    if (partnerId) {
      const [settings] = await db
        .select()
        .from(teamSettings)
        .where(eq(teamSettings.partnerId, partnerId))
        .limit(1);
      if (settings?.anthropicApiKey) {
        // Decrypt if encrypted, otherwise use as-is (backwards compat)
        if (process.env.ENCRYPTION_KEY && isEncrypted(settings.anthropicApiKey)) {
          return decrypt(settings.anthropicApiKey);
        }
        return settings.anthropicApiKey;
      }
    }
  } catch {
    // DB not available, fall through
  }
  // Fall back to env var
  return process.env.ANTHROPIC_API_KEY || '';
}

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

export async function createChatCompletion(
  messages: Anthropic.MessageParam[],
  options: {
    model?: string;
    max_tokens?: number;
    system?: string;
    partnerId?: string;
  } = {}
): Promise<Anthropic.Message> {
  const {
    model = 'claude-sonnet-4-20250514',
    max_tokens = 4096,
    system,
    partnerId,
  } = options;

  const key = await getApiKey(partnerId);
  const client = new Anthropic({ apiKey: key });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens,
        messages,
        ...(system ? { system } : {}),
      });

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on auth or validation errors
      if (
        lastError.message.includes('401') ||
        lastError.message.includes('invalid') ||
        lastError.message.includes('Invalid')
      ) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed after retries');
}
