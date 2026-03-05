import type { CardMix, MarginEstimate } from './types';

export const INTERCHANGE_DEBIT = 20;   // 0.20% = 20bps (EU regulated)
export const INTERCHANGE_CREDIT = 30;  // 0.30% = 30bps (EU regulated)
export const INTERCHANGE_AMEX = 150;   // 1.50% = 150bps
export const SCHEME_FEES = 8;          // ~8bps flat

export function estimateInterchangeCost(cardMix: CardMix): { interchangeCost: number; schemeFees: number; totalCost: number } {
  const debitShare = cardMix.debit / 100;
  const amexShare = cardMix.amex / 100;
  const nonAmexShare = 1 - amexShare;

  // Debit share within non-Amex portion
  const debitWithinNonAmex = nonAmexShare > 0 ? Math.min(debitShare / nonAmexShare, 1) : 0;

  // Weighted interchange for Visa/MC portion
  const visaMcInterchange =
    debitWithinNonAmex * INTERCHANGE_DEBIT + (1 - debitWithinNonAmex) * INTERCHANGE_CREDIT;

  // Overall weighted interchange
  const interchangeCost = round(
    amexShare * INTERCHANGE_AMEX + nonAmexShare * visaMcInterchange
  );

  return {
    interchangeCost,
    schemeFees: SCHEME_FEES,
    totalCost: round(interchangeCost + SCHEME_FEES),
  };
}

export function estimateMargin(
  adjustedRate: number,
  cardMix: CardMix
): MarginEstimate {
  const costs = estimateInterchangeCost(cardMix);

  // adjustedRate is the Banyan markup ON TOP of interchange+scheme
  // margin = adjustedRate (since costs are passed through)
  const margin = round(adjustedRate);
  const totalMerchantRate = round(costs.totalCost + adjustedRate);
  const marginPercent =
    totalMerchantRate > 0 ? round((margin / totalMerchantRate) * 100) : 0;

  return {
    interchangeCost: costs.interchangeCost,
    schemeFees: costs.schemeFees,
    totalCost: costs.totalCost,
    margin,
    marginPercent,
    healthy: margin > 5,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
