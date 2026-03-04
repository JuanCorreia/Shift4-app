import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { teamSettings } from '@/lib/db/schema';

let _anthropic: Anthropic | null = null;
let _cachedKey: string | null = null;

async function getApiKey(): Promise<string> {
  // Try DB first
  try {
    const settings = await db.select().from(teamSettings).limit(1);
    if (settings[0]?.anthropicApiKey) {
      return settings[0].anthropicApiKey;
    }
  } catch {
    // DB not available, fall through
  }
  // Fall back to env var
  return process.env.ANTHROPIC_API_KEY || '';
}

async function getAnthropic(): Promise<Anthropic> {
  const key = await getApiKey();
  // Recreate client if key changed
  if (_anthropic && _cachedKey === key) {
    return _anthropic;
  }
  _anthropic = new Anthropic({ apiKey: key });
  _cachedKey = key;
  return _anthropic;
}

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

export async function createChatCompletion(
  messages: Anthropic.MessageParam[],
  options: {
    model?: string;
    max_tokens?: number;
    system?: string;
  } = {}
): Promise<Anthropic.Message> {
  const {
    model = 'claude-sonnet-4-20250514',
    max_tokens = 4096,
    system,
  } = options;

  let lastError: Error | null = null;
  const client = await getAnthropic();

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
