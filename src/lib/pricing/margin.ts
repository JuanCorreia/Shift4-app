import type { CardMix, MarginEstimate } from './types';

const INTERCHANGE_DEBIT = 20;   // 0.20% = 20bps (EU regulated)
const INTERCHANGE_CREDIT = 30;  // 0.30% = 30bps (EU regulated)
const INTERCHANGE_AMEX = 150;   // 1.50% = 150bps
const SCHEME_FEES = 8;          // ~8bps flat

export function estimateMargin(
  adjustedRate: number,
  cardMix: CardMix
): MarginEstimate {
  const debitShare = cardMix.debit / 100;
  const amexShare = cardMix.amex / 100;
  const nonAmexShare = 1 - amexShare;

  // Weighted interchange for Visa/MC portion (split by debit/credit within non-amex)
  const visaMcInterchange =
    debitShare * INTERCHANGE_DEBIT + (1 - debitShare) * INTERCHANGE_CREDIT;

  // Overall weighted interchange: amex portion at amex rate, rest at visa/mc weighted rate
  const interchangeCost = round(
    amexShare * INTERCHANGE_AMEX + nonAmexShare * visaMcInterchange
  );

  const totalCost = round(interchangeCost + SCHEME_FEES);
  const margin = round(adjustedRate - totalCost);
  const marginPercent =
    adjustedRate > 0 ? round((margin / adjustedRate) * 100) : 0;

  return {
    interchangeCost,
    schemeFees: SCHEME_FEES,
    totalCost,
    margin,
    marginPercent,
    healthy: margin > 5,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
