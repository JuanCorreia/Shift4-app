import type { PricingInput, DccResult } from './types';

export function calculateDccRevenue(input: PricingInput): DccResult | null {
  if (!input.dccEligible) return null;

  const eligibleVolume = input.annualVolume * (input.cardMix.international / 100);
  const projectedUptake = eligibleVolume * (input.dccUptake / 100);
  const annualRevenue = projectedUptake * (input.dccMarkup / 100);

  const merchantShare = input.merchantDccShare ?? 1.0;
  const shift4Rate = 1.5;

  const revenueShareMerchant = round(projectedUptake * (merchantShare / 100));
  const revenueShareShift4 = round(projectedUptake * (shift4Rate / 100));
  const revenueShareHost = round(annualRevenue - revenueShareMerchant - revenueShareShift4);

  return {
    eligibleVolume: round(eligibleVolume),
    projectedUptake: round(projectedUptake),
    annualRevenue: round(annualRevenue),
    revenueShareMerchant,
    revenueShareShift4,
    revenueShareHost,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
