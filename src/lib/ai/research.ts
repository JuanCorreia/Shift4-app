import { createChatCompletion } from './client';
import { RESEARCH_SYSTEM_PROMPT } from './prompts/research-system';

export interface HotelResearchResult {
  hotelName: string;
  propertyCount: number | null;
  starRating: number | null;
  locations: string[];
  internationalPercent: number | null;
  corporatePercent: number | null;
  marketSegment: 'luxury' | 'upscale' | 'midscale' | 'economy' | null;
  estimatedAnnualVolume: number | null;
  estimatedAvgTransaction: number | null;
  notes: string;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
}

export async function researchHotel(hotelName: string, partnerId?: string): Promise<HotelResearchResult> {
  const message = await createChatCompletion(
    [
      {
        role: 'user',
        content: `Research the following hotel or hotel group: "${hotelName}". Return only the JSON object, no markdown fences or extra text.`,
      },
    ],
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: RESEARCH_SYSTEM_PROMPT,
      partnerId,
    }
  );

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => {
      if (block.type === 'text') return block.text;
      return '';
    })
    .join('');

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const result: HotelResearchResult = JSON.parse(cleaned);
  return result;
}
