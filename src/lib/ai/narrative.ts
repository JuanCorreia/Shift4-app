import { createChatCompletion } from './client';
import { getNarrativeSystemPrompt } from './prompts/narrative-system';
import { getMarketContextSystemPrompt } from './prompts/market-context-system';
import type { Deal } from '@/lib/db/schema';
import type { PricingResult } from '@/lib/pricing/types';

export interface NarrativeInput {
  merchantName: string;
  hotelGroup?: string | null;
  starRating?: number | null;
  propertyCount?: number | null;
  location?: string | null;
  annualVolume: number;
  avgTransactionSize: number;
  currentProcessor?: string | null;
  currentBlendedRate?: number | null;
  currentTxFee?: number | null;
  currentMonthlyFee?: number | null;
  dccEligible?: boolean;
  pricingResult: PricingResult;
}

function buildNarrativePrompt(data: NarrativeInput): string {
  const pr = data.pricingResult;

  let prompt = `Generate a proposal narrative for the following deal:\n\n`;
  prompt += `MERCHANT: ${data.merchantName}\n`;
  if (data.hotelGroup) prompt += `Hotel Group: ${data.hotelGroup}\n`;
  if (data.starRating) prompt += `Star Rating: ${data.starRating}-star\n`;
  if (data.propertyCount && data.propertyCount > 1) prompt += `Properties: ${data.propertyCount}\n`;
  if (data.location) prompt += `Location: ${data.location}\n`;

  prompt += `\nVOLUME:\n`;
  prompt += `Annual Processing Volume: EUR ${data.annualVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
  prompt += `Average Transaction Size: EUR ${data.avgTransactionSize.toFixed(2)}\n`;

  if (data.currentProcessor || data.currentBlendedRate) {
    prompt += `\nCURRENT PROCESSOR:\n`;
    if (data.currentProcessor) prompt += `Processor: ${data.currentProcessor}\n`;
    if (data.currentBlendedRate) prompt += `Current Blended Rate: ${data.currentBlendedRate} bps\n`;
    if (data.currentTxFee) prompt += `Current Transaction Fee: EUR ${data.currentTxFee}\n`;
    if (data.currentMonthlyFee) prompt += `Current Monthly Fee: EUR ${data.currentMonthlyFee}\n`;
  }

  prompt += `\nBANYAN PROPOSED PRICING:\n`;
  prompt += `Tier: ${pr.tierName} (Tier ${pr.tier})\n`;
  prompt += `Proposed Rate: ${pr.adjustedRate} bps\n`;
  prompt += `Proposed Transaction Fee: EUR ${pr.proposedTxFee}\n`;
  prompt += `Proposed Monthly Fee: EUR ${pr.proposedMonthlyFee}\n`;

  prompt += `\nSAVINGS ANALYSIS:\n`;
  prompt += `Current Annual Cost: EUR ${pr.annualCostCurrent.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
  prompt += `Proposed Annual Cost: EUR ${pr.annualCostProposed.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
  prompt += `Annual Savings: EUR ${pr.annualSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${pr.savingsPercent.toFixed(1)}%)\n`;

  if (data.dccEligible && pr.dccRevenue) {
    prompt += `\nDCC OPPORTUNITY:\n`;
    prompt += `Eligible International Volume: EUR ${pr.dccRevenue.eligibleVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
    prompt += `Projected Uptake Volume: EUR ${pr.dccRevenue.projectedUptake.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
    prompt += `Annual DCC Revenue: EUR ${pr.dccRevenue.annualRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
    prompt += `Merchant Revenue Share: EUR ${pr.dccRevenue.revenueShareMerchant.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
  }

  return prompt;
}

export function dealToNarrativeInput(deal: Deal): NarrativeInput {
  return {
    merchantName: deal.merchantName,
    hotelGroup: deal.hotelGroup,
    starRating: deal.starRating,
    propertyCount: deal.propertyCount,
    location: deal.location,
    annualVolume: Number(deal.annualVolume),
    avgTransactionSize: Number(deal.avgTransactionSize),
    currentProcessor: deal.currentProcessor,
    currentBlendedRate: deal.currentBlendedRate ? Number(deal.currentBlendedRate) : null,
    currentTxFee: deal.currentTxFee ? Number(deal.currentTxFee) : null,
    currentMonthlyFee: deal.currentMonthlyFee ? Number(deal.currentMonthlyFee) : null,
    dccEligible: deal.dccEligible ?? false,
    pricingResult: deal.pricingResult as unknown as PricingResult,
  };
}

export async function generateNarrative(data: NarrativeInput, partnerId?: string, tone?: string): Promise<string> {
  const prompt = buildNarrativePrompt(data);
  const systemPrompt = getNarrativeSystemPrompt(tone || "formal");

  const response = await createChatCompletion(
    [{ role: 'user', content: prompt }],
    {
      system: systemPrompt,
      max_tokens: 3000,
      partnerId,
    }
  );

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return block.text.trim();
}

function buildMarketContextPrompt(data: NarrativeInput): string {
  const pr = data.pricingResult;

  let prompt = `Generate a market context analysis for the following hotel deal:\n\n`;
  prompt += `MERCHANT: ${data.merchantName}\n`;
  if (data.hotelGroup) prompt += `Hotel Group: ${data.hotelGroup}\n`;
  if (data.starRating) prompt += `Star Rating: ${data.starRating}-star\n`;
  if (data.propertyCount && data.propertyCount > 1) prompt += `Properties: ${data.propertyCount}\n`;
  if (data.location) prompt += `Location: ${data.location}\n`;

  prompt += `\nVOLUME:\n`;
  prompt += `Annual Processing Volume: EUR ${data.annualVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
  prompt += `Average Transaction Size: EUR ${data.avgTransactionSize.toFixed(2)}\n`;

  if (data.currentProcessor || data.currentBlendedRate) {
    prompt += `\nCURRENT ACQUIRER:\n`;
    if (data.currentProcessor) prompt += `Processor: ${data.currentProcessor}\n`;
    if (data.currentBlendedRate) prompt += `Current Blended Rate: ${data.currentBlendedRate} bps\n`;
    if (data.currentTxFee) prompt += `Current Transaction Fee: EUR ${data.currentTxFee}\n`;
    if (data.currentMonthlyFee) prompt += `Current Monthly Fee: EUR ${data.currentMonthlyFee}\n`;
    prompt += `Current Annual Cost: EUR ${pr.annualCostCurrent.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
  }

  prompt += `\nOUR PROPOSED PRICING:\n`;
  prompt += `Tier: ${pr.tierName} (Tier ${pr.tier})\n`;
  prompt += `Proposed Rate: ${pr.adjustedRate} bps (IC++ model)\n`;
  prompt += `IC breakdown — Interchange: ${pr.marginEstimate.interchangeCost} bps, Scheme fees: ${pr.marginEstimate.schemeFees} bps, Our margin: ${pr.marginEstimate.margin} bps\n`;
  prompt += `Proposed Transaction Fee: EUR ${pr.proposedTxFee}\n`;
  prompt += `Proposed Monthly Fee: EUR ${pr.proposedMonthlyFee}\n`;
  prompt += `Proposed Annual Cost: EUR ${pr.annualCostProposed.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
  prompt += `Annual Savings: EUR ${pr.annualSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${pr.savingsPercent.toFixed(1)}%)\n`;

  if (data.dccEligible && pr.dccRevenue) {
    prompt += `\nDCC CONTEXT:\n`;
    prompt += `DCC eligible — International volume: EUR ${pr.dccRevenue.eligibleVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
    prompt += `Projected DCC revenue: EUR ${pr.dccRevenue.annualRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}\n`;
  }

  prompt += `\nPlease analyze the market context for this deal. Reference rates from past acquirer statements, comparable hotel proposals, and relevant hospitality payment trends. Explain why we are offering this price and what benefits the switch creates.`;

  return prompt;
}

export async function generateMarketContext(data: NarrativeInput, partnerId?: string): Promise<string> {
  const prompt = buildMarketContextPrompt(data);
  const systemPrompt = getMarketContextSystemPrompt();

  const response = await createChatCompletion(
    [{ role: 'user', content: prompt }],
    {
      system: systemPrompt,
      max_tokens: 3000,
      partnerId,
    }
  );

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return block.text.trim();
}
