import { createChatCompletion } from './client';
import { OCR_SYSTEM_PROMPT } from './prompts/ocr-system';

export interface StatementOcrResult {
  merchantName: string;
  processorName: string;
  period: string;
  annualVolume: number;
  monthlyVolume: number;
  transactionCount: number;
  avgTransactionSize: number;
  blendedRate: number; // basis points
  transactionFee: number;
  monthlyFee: number;
  cardMix: {
    visa: number;
    mastercard: number;
    amex: number;
    other: number;
  };
  internationalPercent: number;
  confidence: {
    overall: number; // 0-100
    fields: Record<string, number>;
  };
  rawNotes: string;
}

export async function parseStatement(pdfBase64: string, partnerId?: string): Promise<StatementOcrResult> {
  const response = await createChatCompletion(
    [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          } as never,
          {
            type: 'text',
            text: 'Extract all merchant statement data from this PDF. Return the structured JSON as specified.',
          },
        ],
      },
    ],
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: OCR_SYSTEM_PROMPT,
      partnerId,
    }
  );

  // Extract text content from the response
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from AI model');
  }

  const rawText = textBlock.text.trim();

  // Try to parse JSON — handle potential markdown wrapping
  let jsonStr = rawText;
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed: StatementOcrResult;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${rawText.substring(0, 200)}`);
  }

  // Validate required fields exist
  if (!parsed.confidence) {
    parsed.confidence = {
      overall: 50,
      fields: {},
    };
  }

  if (!parsed.cardMix) {
    parsed.cardMix = { visa: 0, mastercard: 0, amex: 0, other: 0 };
  }

  if (typeof parsed.annualVolume !== 'number') parsed.annualVolume = 0;
  if (typeof parsed.monthlyVolume !== 'number') parsed.monthlyVolume = 0;
  if (typeof parsed.transactionCount !== 'number') parsed.transactionCount = 0;
  if (typeof parsed.avgTransactionSize !== 'number') parsed.avgTransactionSize = 0;
  if (typeof parsed.blendedRate !== 'number') parsed.blendedRate = 0;
  if (typeof parsed.transactionFee !== 'number') parsed.transactionFee = 0;
  if (typeof parsed.monthlyFee !== 'number') parsed.monthlyFee = 0;
  if (typeof parsed.internationalPercent !== 'number') parsed.internationalPercent = 0;
  if (typeof parsed.rawNotes !== 'string') parsed.rawNotes = '';

  return parsed;
}
