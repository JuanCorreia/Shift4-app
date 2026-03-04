import type { PricingInput, DccResult } from './types';

export function calculateDccRevenue(input: PricingInput): DccResult | null {
  if (!input.dccEligible) return null;

  const eligibleVolume = input.annualVolume * (input.cardMix.international / 100);
  const projectedUptake = eligibleVolume * (input.dccUptake / 100);
  const annualRevenue = projectedUptake * (input.dccMarkup / 100);
  const revenueShareMerchant = round(annualRevenue * 0.5);
  const revenueShareShift4 = round(annualRevenue * 0.5);

  return {
    eligibleVolume: round(eligibleVolume),
    projectedUptake: round(projectedUptake),
    annualRevenue: round(annualRevenue),
    revenueShareMerchant,
    revenueShareShift4,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
