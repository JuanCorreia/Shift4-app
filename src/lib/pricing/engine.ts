import type { PricingInput, PricingResult } from './types';
import { getTier, getTierDefinition } from './tiers';
import { estimateMargin } from './margin';
import { calculateDccRevenue } from './dcc';
import { generateEscalations } from './escalation';

export function calculatePricing(input: PricingInput): PricingResult {
  const tier = getTier(input.annualVolume);
  const tierDef = getTierDefinition(tier);

  // Card mix adjustments
  const adjustedRate = calculateAdjustedRate(tierDef.baseRate, input);

  // Transaction count
  const txCount =
    input.avgTransactionSize > 0
      ? input.annualVolume / input.avgTransactionSize
      : 0;

  // Annual cost — current
  const annualCostCurrent =
    input.annualVolume * (input.currentBlendedRate / 10_000) +
    txCount * input.currentTxFee +
    input.currentMonthlyFee * 12 * input.propertyCount;

  // Annual cost — proposed
  const annualCostProposed =
    input.annualVolume * (adjustedRate / 10_000) +
    txCount * tierDef.txFee +
    tierDef.monthlyFee * 12 * input.propertyCount;

  const annualSavings = round(annualCostCurrent - annualCostProposed);
  const savingsPercent =
    annualCostCurrent > 0
      ? round((annualSavings / annualCostCurrent) * 100)
      : 0;

  // DCC revenue
  const dccRevenue = calculateDccRevenue(input);

  // Margin estimation
  const marginEstimate = estimateMargin(adjustedRate, input.cardMix);

  // Build partial result for escalation checks
  const partialResult = {
    tier,
    tierName: tierDef.name,
    baseRate: tierDef.baseRate,
    adjustedRate,
    proposedTxFee: tierDef.txFee,
    proposedMonthlyFee: tierDef.monthlyFee,
    annualCostCurrent: round(annualCostCurrent),
    annualCostProposed: round(annualCostProposed),
    annualSavings,
    savingsPercent,
    dccRevenue,
    marginEstimate,
  };

  const escalations = generateEscalations(input, partialResult);

  return {
    ...partialResult,
    escalations,
  };
}

function calculateAdjustedRate(baseRate: number, input: PricingInput): number {
  let rate = baseRate;

  // Amex premium: amex% > 15% adds (amex - 15) * 0.5 bps
  if (input.cardMix.amex > 15) {
    rate += (input.cardMix.amex - 15) * 0.5;
  }

  // International premium: international > 30% adds (intl - 30) * 0.3 bps
  if (input.cardMix.international > 30) {
    rate += (input.cardMix.international - 30) * 0.3;
  }

  // Corporate premium: corporate > 20% adds (corp - 20) * 0.4 bps
  if (input.cardMix.corporate > 20) {
    rate += (input.cardMix.corporate - 20) * 0.4;
  }

  // Debit discount: debit > 40% subtracts (debit - 40) * 0.2 bps
  if (input.cardMix.debit > 40) {
    rate -= (input.cardMix.debit - 40) * 0.2;
  }

  return round(rate);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
