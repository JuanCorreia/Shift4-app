export type TierLevel = 1 | 2 | 3 | 4 | 5;

export interface CardMix {
  visa: number;
  mastercard: number;
  amex: number;
  other: number;
  international: number;
  corporate: number;
  debit: number;
}

export interface PricingInput {
  merchantName: string;
  annualVolume: number;
  avgTransactionSize: number;
  cardMix: CardMix;
  currentBlendedRate: number;
  currentTxFee: number;
  currentMonthlyFee: number;
  dccEligible: boolean;
  dccUptake: number;
  dccMarkup: number;
  propertyCount: number;
  starRating: number;
}

export interface PricingResult {
  tier: TierLevel;
  tierName: string;
  baseRate: number;
  adjustedRate: number;
  proposedTxFee: number;
  proposedMonthlyFee: number;
  annualCostCurrent: number;
  annualCostProposed: number;
  annualSavings: number;
  savingsPercent: number;
  dccRevenue: DccResult | null;
  marginEstimate: MarginEstimate;
  escalations: Escalation[];
}

export interface DccResult {
  eligibleVolume: number;
  projectedUptake: number;
  annualRevenue: number;
  revenueShareMerchant: number;
  revenueShareShift4: number;
}

export interface MarginEstimate {
  interchangeCost: number;
  schemeFees: number;
  totalCost: number;
  margin: number;
  marginPercent: number;
  healthy: boolean;
}

export type EscalationSeverity = 'warning' | 'critical';
export type EscalationCode =
  | 'TIER1_REVIEW'
  | 'BELOW_FLOOR'
  | 'HEAVY_AMEX'
  | 'NEGATIVE_SAVINGS'
  | 'LOW_MARGIN'
  | 'UNREALISTIC_DCC'
  | 'HIGH_INTERNATIONAL'
  | 'LARGE_DEAL';

export interface Escalation {
  code: EscalationCode;
  severity: EscalationSeverity;
  message: string;
  details?: string;
}

export interface TierDefinition {
  tier: TierLevel;
  name: string;
  minVolume: number;
  maxVolume: number | null;
  baseRate: number;
  txFee: number;
  monthlyFee: number;
}
