import type { TierDefinition, TierLevel } from './types';

const TIER_DEFINITIONS: TierDefinition[] = [
  {
    tier: 1,
    name: 'Enterprise',
    minVolume: 100_000_000,
    maxVolume: null,
    baseRate: 18,
    txFee: 0.02,
    monthlyFee: 150,
  },
  {
    tier: 2,
    name: 'Premium',
    minVolume: 25_000_000,
    maxVolume: 100_000_000,
    baseRate: 25,
    txFee: 0.04,
    monthlyFee: 100,
  },
  {
    tier: 3,
    name: 'Professional',
    minVolume: 5_000_000,
    maxVolume: 25_000_000,
    baseRate: 32,
    txFee: 0.06,
    monthlyFee: 75,
  },
  {
    tier: 4,
    name: 'Standard',
    minVolume: 1_000_000,
    maxVolume: 5_000_000,
    baseRate: 38,
    txFee: 0.08,
    monthlyFee: 50,
  },
  {
    tier: 5,
    name: 'Starter',
    minVolume: 0,
    maxVolume: 1_000_000,
    baseRate: 45,
    txFee: 0.10,
    monthlyFee: 35,
  },
];

export function getTier(annualVolume: number): TierLevel {
  if (annualVolume >= 100_000_000) return 1;
  if (annualVolume >= 25_000_000) return 2;
  if (annualVolume >= 5_000_000) return 3;
  if (annualVolume >= 1_000_000) return 4;
  return 5;
}

export function getTierDefinition(tier: TierLevel): TierDefinition {
  const def = TIER_DEFINITIONS.find((t) => t.tier === tier);
  if (!def) {
    throw new Error(`Invalid tier level: ${tier}`);
  }
  return def;
}

export { TIER_DEFINITIONS };
