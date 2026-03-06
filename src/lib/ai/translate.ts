import { createChatCompletion } from './client';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  pt: 'Portuguese (European)',
  es: 'Spanish',
  fr: 'French',
};

export async function translateProposalContent(
  text: string,
  targetLang: string,
  partnerId?: string
): Promise<string> {
  if (targetLang === 'en') return text;

  const langName = LANGUAGE_NAMES[targetLang] || targetLang;

  const response = await createChatCompletion(
    [
      {
        role: 'user',
        content: `Translate the following commercial proposal text into ${langName}. Maintain the professional tone, keep all numbers, currency symbols, and technical terms (like "bps", "IC++", "PCI DSS") unchanged. Do not add explanations or notes — return only the translated text.\n\n${text}`,
      },
    ],
    {
      system: `You are a professional translator specializing in financial and hospitality industry documents. Translate accurately while maintaining the formal business tone of the original.`,
      max_tokens: 4000,
      partnerId,
    }
  );

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return block.text.trim();
}
