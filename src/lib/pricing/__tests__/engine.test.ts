import { describe, it, expect } from 'vitest';
import { calculatePricing } from '../engine';
import { getTier, getTierDefinition } from '../tiers';
import { estimateMargin, estimateInterchangeCost } from '../margin';
import { calculateDccRevenue } from '../dcc';
import type { PricingInput, CardMix } from '../types';

// Helper to build a default card mix
function defaultCardMix(overrides: Partial<CardMix> = {}): CardMix {
  return {
    visa: 50,
    mastercard: 30,
    amex: 10,
    mbway: 0,
    other: 10,
    international: 20,
    corporate: 10,
    debit: 30,
    ...overrides,
  };
}

// Helper to build a default pricing input
function defaultInput(overrides: Partial<PricingInput> = {}): PricingInput {
  return {
    merchantName: 'Test Hotel',
    annualVolume: 10_000_000,
    avgTransactionSize: 200,
    cardMix: defaultCardMix(),
    currentBlendedRate: 120, // realistic blended rate (1.2%) for IC++ model
    currentTxFee: 0.10,
    currentMonthlyFee: 100,
    dccEligible: false,
    dccUptake: 30,
    dccMarkup: 2.5,
    merchantDccShare: 1.0,
    propertyCount: 1,
    starRating: 4,
    ...overrides,
  };
}

// Default card mix IC: 10% amex(150) + 90% non-amex(33% debit(20) + 67% credit(30))
// = 15 + 0.90 * 26.67 = 15 + 24 = 39bps interchange, +8 scheme = 47bps total cost
// Tier 3 markup = 32bps → total merchant rate = 47 + 32 = 79bps

// --- Tier Tests ---

describe('getTier', () => {
  it('returns tier 1 for €100M+', () => {
    expect(getTier(100_000_000)).toBe(1);
    expect(getTier(200_000_000)).toBe(1);
  });

  it('returns tier 2 for €25M-€100M', () => {
    expect(getTier(25_000_000)).toBe(2);
    expect(getTier(99_999_999)).toBe(2);
  });

  it('returns tier 3 for €5M-€25M', () => {
    expect(getTier(5_000_000)).toBe(3);
    expect(getTier(24_999_999)).toBe(3);
  });

  it('returns tier 4 for €1M-€5M', () => {
    expect(getTier(1_000_000)).toBe(4);
    expect(getTier(4_999_999)).toBe(4);
  });

  it('returns tier 5 for <€1M', () => {
    expect(getTier(999_999)).toBe(5);
    expect(getTier(0)).toBe(5);
  });

  it('handles exact boundaries correctly', () => {
    expect(getTier(100_000_000)).toBe(1);
    expect(getTier(25_000_000)).toBe(2);
    expect(getTier(5_000_000)).toBe(3);
    expect(getTier(1_000_000)).toBe(4);
  });
});

describe('getTierDefinition', () => {
  it('returns correct definition for each tier', () => {
    const t1 = getTierDefinition(1);
    expect(t1.baseRate).toBe(18);
    expect(t1.txFee).toBe(0.02);
    expect(t1.monthlyFee).toBe(150);

    const t3 = getTierDefinition(3);
    expect(t3.baseRate).toBe(32);
    expect(t3.txFee).toBe(0.06);
    expect(t3.monthlyFee).toBe(75);

    const t5 = getTierDefinition(5);
    expect(t5.baseRate).toBe(45);
    expect(t5.txFee).toBe(0.10);
    expect(t5.monthlyFee).toBe(35);
  });
});

// --- Engine Tests (IC++ model) ---

describe('calculatePricing', () => {
  it('calculates a standard Tier 3 hotel correctly', () => {
    const input = defaultInput();
    const result = calculatePricing(input);

    expect(result.tier).toBe(3);
    expect(result.tierName).toBe('Professional');
    expect(result.baseRate).toBe(32);
    // IC++ model: adjustedRate = IC(39) + scheme(8) + markup(32) = 79bps total merchant rate
    expect(result.adjustedRate).toBe(79);
    expect(result.proposedTxFee).toBe(0.06);
    expect(result.proposedMonthlyFee).toBe(75);
    // Margin should be the markup (32bps), always positive
    expect(result.marginEstimate.margin).toBe(32);
    expect(result.marginEstimate.healthy).toBe(true);
  });

  it('calculates annual costs correctly', () => {
    const input = defaultInput({
      annualVolume: 10_000_000,
      avgTransactionSize: 200,
      currentBlendedRate: 120, // 1.2% blended (realistic IC++ comparison)
      currentTxFee: 0.10,
      currentMonthlyFee: 100,
      propertyCount: 1,
    });
    const result = calculatePricing(input);

    // Current cost: 10M * 120/10000 + 50000 * 0.10 + 100 * 12 * 1
    // = 120000 + 5000 + 1200 = 126200
    expect(result.annualCostCurrent).toBe(126200);

    // Proposed cost: 10M * 79/10000 + 50000 * 0.06 + 75 * 12 * 1
    // = 79000 + 3000 + 900 = 82900
    expect(result.annualCostProposed).toBe(82900);

    expect(result.annualSavings).toBe(43300);
    expect(result.savingsPercent).toBeCloseTo(34.31, 1);
  });

  it('calculates multi-property costs correctly', () => {
    const input = defaultInput({ propertyCount: 5 });
    const result = calculatePricing(input);

    const txCount = 10_000_000 / 200;
    // Total merchant rate = 79bps (IC 39 + scheme 8 + markup 32)
    const expectedCurrent = 10_000_000 * 120 / 10_000 + txCount * 0.10 + 100 * 12 * 5;
    const expectedProposed = 10_000_000 * 79 / 10_000 + txCount * 0.06 + 75 * 12 * 5;
    expect(result.annualCostCurrent).toBe(expectedCurrent);
    expect(result.annualCostProposed).toBe(expectedProposed);
  });

  it('applies amex premium when amex > 15%', () => {
    const input = defaultInput({
      cardMix: defaultCardMix({ amex: 25 }),
    });
    const result = calculatePricing(input);

    // Markup: 32 + (25-15)*0.5 = 37bps
    // IC: 25% amex(150) + 75% non-amex(debit 0.30/0.75=40% at 20, 60% credit at 30 = 26)
    // = 37.5 + 19.5 = 57bps + 8 scheme = 65bps total cost
    // Total merchant rate: 65 + 37 = 102bps
    expect(result.adjustedRate).toBe(102);
  });

  it('applies international premium when international > 30%', () => {
    const input = defaultInput({
      cardMix: defaultCardMix({ international: 50 }),
    });
    const result = calculatePricing(input);

    // Markup: 32 + (50-30)*0.3 = 38bps
    // IC unchanged (international doesn't affect IC): 39 + 8 = 47
    // Total: 47 + 38 = 85bps
    expect(result.adjustedRate).toBe(85);
  });

  it('applies corporate premium when corporate > 20%', () => {
    const input = defaultInput({
      cardMix: defaultCardMix({ corporate: 40 }),
    });
    const result = calculatePricing(input);

    // Markup: 32 + (40-20)*0.4 = 40bps
    // IC unchanged: 47
    // Total: 47 + 40 = 87bps
    expect(result.adjustedRate).toBe(87);
  });

  it('applies debit discount when debit > 40%', () => {
    const input = defaultInput({
      cardMix: defaultCardMix({ debit: 60 }),
    });
    const result = calculatePricing(input);

    // Markup: 32 - (60-40)*0.2 = 28bps
    // IC: amex 10%(150) + 90% non-amex(debitWithin=60/90=67% at 20, 33% credit at 30 = 23.33)
    // = 15 + 0.90*23.33 = 15 + 21 = 36bps + 8 = 44 total cost
    // Total: 44 + 28 = 72bps
    expect(result.adjustedRate).toBe(72);
  });

  it('applies multiple adjustments simultaneously', () => {
    const input = defaultInput({
      cardMix: defaultCardMix({
        amex: 25,        // +5bps
        international: 40, // +3bps
        corporate: 30,    // +4bps
        debit: 50,        // -2bps
      }),
    });
    const result = calculatePricing(input);

    // Markup: 32 + 5 + 3 + 4 - 2 = 42bps
    // IC: 25% amex(150) + 75% non-amex(debit 50/75=67% at 20, 33% at 30 = 23.33)
    // = 37.5 + 0.75*23.33 = 37.5 + 17.5 = 55bps + 8 = 63 total cost
    // Total: 63 + 42 = 105bps
    expect(result.adjustedRate).toBe(105);
  });

  it('does not adjust rate when card mix is below thresholds', () => {
    const input = defaultInput({
      cardMix: defaultCardMix({
        amex: 10,
        international: 20,
        corporate: 15,
        debit: 30,
      }),
    });
    const result = calculatePricing(input);
    // Same as default: IC(47) + markup(32) = 79
    expect(result.adjustedRate).toBe(79);
  });
});

// --- DCC Tests ---

describe('calculateDccRevenue', () => {
  it('returns null when DCC is not eligible', () => {
    const input = defaultInput({ dccEligible: false });
    expect(calculateDccRevenue(input)).toBeNull();
  });

  it('calculates DCC revenue correctly', () => {
    const input = defaultInput({
      dccEligible: true,
      dccUptake: 40,
      dccMarkup: 2.5,
      cardMix: defaultCardMix({ international: 30 }),
    });
    const result = calculateDccRevenue(input)!;

    // Eligible: 10M * 30% = 3M
    expect(result.eligibleVolume).toBe(3_000_000);

    // Uptake: 3M * 40% = 1.2M
    expect(result.projectedUptake).toBe(1_200_000);

    // Revenue: 1.2M * 2.5% = 30000
    expect(result.annualRevenue).toBe(30_000);

    // 3-way split: merchant 1.0%, shift4 1.5%, host gets remainder
    // Merchant: 1.2M * 1.0% = 12,000
    expect(result.revenueShareMerchant).toBe(12_000);
    // Shift4: 1.2M * 1.5% = 18,000
    expect(result.revenueShareShift4).toBe(18_000);
    // Host: 30,000 - 12,000 - 18,000 = 0
    expect(result.revenueShareHost).toBe(0);
  });

  it('handles zero international volume', () => {
    const input = defaultInput({
      dccEligible: true,
      dccUptake: 40,
      dccMarkup: 2.5,
      cardMix: defaultCardMix({ international: 0 }),
    });
    const result = calculateDccRevenue(input)!;
    expect(result.eligibleVolume).toBe(0);
    expect(result.annualRevenue).toBe(0);
  });
});

// --- Margin Tests (IC++ model: margin = markup, always positive) ---

describe('estimateMargin', () => {
  it('calculates margin for a standard card mix', () => {
    const mix = defaultCardMix(); // 30% debit, 10% amex
    const result = estimateMargin(32, mix);

    // IC: 10% amex(150) + 90% non-amex(33% debit(20) + 67% credit(30) = 26.67)
    // = 15 + 24 = 39bps
    expect(result.interchangeCost).toBeCloseTo(39, 0);
    expect(result.schemeFees).toBe(8);
    expect(result.totalCost).toBeCloseTo(47, 0);
    // In IC++ model, margin IS the markup (32bps) — costs are pass-through
    expect(result.margin).toBe(32);
    expect(result.healthy).toBe(true);
  });

  it('marks margin as healthy when > 5bps', () => {
    // High rate with low-cost card mix (all debit, no amex)
    const mix = defaultCardMix({ amex: 0, debit: 100, visa: 60, mastercard: 40, mbway: 0 });
    const result = estimateMargin(45, mix);

    // IC: 0% amex + 100% non-amex(100% debit * 20) = 20bps
    expect(result.interchangeCost).toBe(20);
    expect(result.totalCost).toBe(28);
    // Margin = markup = 45bps
    expect(result.margin).toBe(45);
    expect(result.healthy).toBe(true);
  });

  it('handles 100% amex card mix', () => {
    const mix = defaultCardMix({ amex: 100, visa: 0, mastercard: 0, other: 0, debit: 0, mbway: 0 });
    const result = estimateMargin(45, mix);

    // 100% amex = 150bps interchange
    expect(result.interchangeCost).toBe(150);
    expect(result.totalCost).toBe(158);
    // Margin = markup = 45bps (IC is pass-through)
    expect(result.margin).toBe(45);
    expect(result.healthy).toBe(true);
  });
});

// --- Interchange Cost Tests ---

describe('estimateInterchangeCost', () => {
  it('calculates IC for default card mix', () => {
    const costs = estimateInterchangeCost(defaultCardMix());
    expect(costs.interchangeCost).toBeCloseTo(39, 0);
    expect(costs.schemeFees).toBe(8);
    expect(costs.totalCost).toBeCloseTo(47, 0);
  });

  it('calculates IC for 100% debit', () => {
    const costs = estimateInterchangeCost(defaultCardMix({ amex: 0, debit: 100 }));
    expect(costs.interchangeCost).toBe(20);
    expect(costs.totalCost).toBe(28);
  });

  it('calculates IC for 100% amex', () => {
    const costs = estimateInterchangeCost(defaultCardMix({ amex: 100, debit: 0 }));
    expect(costs.interchangeCost).toBe(150);
    expect(costs.totalCost).toBe(158);
  });
});

// --- Escalation Tests ---

describe('generateEscalations', () => {
  it('generates TIER1_REVIEW for tier 1 deals', () => {
    const input = defaultInput({ annualVolume: 150_000_000 });
    const result = calculatePricing(input);

    const tier1Esc = result.escalations.find((e) => e.code === 'TIER1_REVIEW');
    expect(tier1Esc).toBeDefined();
    expect(tier1Esc!.severity).toBe('critical');
  });

  it('generates LARGE_DEAL for volume > €50M', () => {
    const input = defaultInput({ annualVolume: 60_000_000 });
    const result = calculatePricing(input);

    const largeDeal = result.escalations.find((e) => e.code === 'LARGE_DEAL');
    expect(largeDeal).toBeDefined();
    expect(largeDeal!.severity).toBe('warning');
  });

  it('generates HEAVY_AMEX when amex > 25%', () => {
    const input = defaultInput({
      cardMix: defaultCardMix({ amex: 30 }),
    });
    const result = calculatePricing(input);

    const amexEsc = result.escalations.find((e) => e.code === 'HEAVY_AMEX');
    expect(amexEsc).toBeDefined();
    expect(amexEsc!.severity).toBe('warning');
  });

  it('generates HIGH_INTERNATIONAL when international > 50%', () => {
    const input = defaultInput({
      cardMix: defaultCardMix({ international: 55 }),
    });
    const result = calculatePricing(input);

    const intlEsc = result.escalations.find((e) => e.code === 'HIGH_INTERNATIONAL');
    expect(intlEsc).toBeDefined();
  });

  it('generates UNREALISTIC_DCC when uptake > 60%', () => {
    const input = defaultInput({
      dccEligible: true,
      dccUptake: 70,
    });
    const result = calculatePricing(input);

    const dccEsc = result.escalations.find((e) => e.code === 'UNREALISTIC_DCC');
    expect(dccEsc).toBeDefined();
  });

  it('does not generate UNREALISTIC_DCC when DCC is not eligible', () => {
    const input = defaultInput({
      dccEligible: false,
      dccUptake: 70,
    });
    const result = calculatePricing(input);

    const dccEsc = result.escalations.find((e) => e.code === 'UNREALISTIC_DCC');
    expect(dccEsc).toBeUndefined();
  });

  it('generates NEGATIVE_SAVINGS when proposed is more expensive', () => {
    // Very low current rate so proposed is more expensive
    const input = defaultInput({
      currentBlendedRate: 10,
      currentTxFee: 0.01,
      currentMonthlyFee: 10,
    });
    const result = calculatePricing(input);

    const negSav = result.escalations.find((e) => e.code === 'NEGATIVE_SAVINGS');
    expect(negSav).toBeDefined();
    expect(negSav!.severity).toBe('critical');
    expect(result.annualSavings).toBeLessThan(0);
  });

  it('does not generate LOW_MARGIN for standard deals (IC++ model)', () => {
    // With IC++ model, margin = markup (32bps for Tier 3), always healthy
    const input = defaultInput();
    const result = calculatePricing(input);

    const lowMargin = result.escalations.find((e) => e.code === 'LOW_MARGIN');
    expect(lowMargin).toBeUndefined();
    expect(result.marginEstimate.margin).toBe(32);
    expect(result.marginEstimate.healthy).toBe(true);
  });

  it('does not generate false escalations for clean deals', () => {
    // Tier 4, normal card mix, DCC off, reasonable current rates
    const input = defaultInput({
      annualVolume: 2_000_000,
      cardMix: defaultCardMix({ amex: 5, international: 10, corporate: 5, debit: 80 }),
      currentBlendedRate: 120,
      currentTxFee: 0.15,
      currentMonthlyFee: 100,
      dccEligible: false,
    });
    const result = calculatePricing(input);

    expect(result.escalations.find((e) => e.code === 'TIER1_REVIEW')).toBeUndefined();
    expect(result.escalations.find((e) => e.code === 'HEAVY_AMEX')).toBeUndefined();
    expect(result.escalations.find((e) => e.code === 'HIGH_INTERNATIONAL')).toBeUndefined();
    expect(result.escalations.find((e) => e.code === 'UNREALISTIC_DCC')).toBeUndefined();
    expect(result.escalations.find((e) => e.code === 'LARGE_DEAL')).toBeUndefined();
    expect(result.escalations.find((e) => e.code === 'NEGATIVE_SAVINGS')).toBeUndefined();
    expect(result.escalations.find((e) => e.code === 'LOW_MARGIN')).toBeUndefined();
    expect(result.annualSavings).toBeGreaterThan(0);
  });
});

// --- Edge Cases ---

describe('edge cases', () => {
  it('handles zero annual volume', () => {
    const input = defaultInput({ annualVolume: 0, avgTransactionSize: 200 });
    const result = calculatePricing(input);

    expect(result.tier).toBe(5);
    // Current: just monthly fees = 100*12 = 1200
    expect(result.annualCostCurrent).toBe(1200);
    // Proposed: just monthly fees = 35*12 = 420 (zero volume, rate irrelevant)
    expect(result.annualCostProposed).toBe(420);
  });

  it('handles zero avg transaction size gracefully', () => {
    const input = defaultInput({ avgTransactionSize: 0 });
    const result = calculatePricing(input);

    // txCount = 0, so no per-tx fees
    expect(result.tier).toBe(3);
    const expectedCurrent = 10_000_000 * 120 / 10_000 + 0 + 100 * 12;
    expect(result.annualCostCurrent).toBe(expectedCurrent);
  });

  it('handles 100% visa card mix', () => {
    const input = defaultInput({
      cardMix: {
        visa: 100,
        mastercard: 0,
        amex: 0,
        mbway: 0,
        other: 0,
        international: 0,
        corporate: 0,
        debit: 0,
      },
    });
    const result = calculatePricing(input);
    // IC: 0% amex, 100% credit at 30bps = 30 + 8 scheme = 38 total cost
    // Markup: 32 (no adjustments)
    // Total: 38 + 32 = 70
    expect(result.adjustedRate).toBe(70);
  });

  it('calculates DCC integrated into full pricing', () => {
    const input = defaultInput({
      dccEligible: true,
      dccUptake: 40,
      dccMarkup: 3,
      cardMix: defaultCardMix({ international: 40 }),
    });
    const result = calculatePricing(input);

    expect(result.dccRevenue).not.toBeNull();
    expect(result.dccRevenue!.eligibleVolume).toBe(4_000_000);
    expect(result.dccRevenue!.annualRevenue).toBe(48_000);
  });

  it('returns correct tier for exact boundary at €100M', () => {
    expect(getTier(100_000_000)).toBe(1);
    expect(getTier(99_999_999)).toBe(2);
  });

  it('returns correct tier for exact boundary at €25M', () => {
    expect(getTier(25_000_000)).toBe(2);
    expect(getTier(24_999_999)).toBe(3);
  });

  it('returns correct tier for exact boundary at €5M', () => {
    expect(getTier(5_000_000)).toBe(3);
    expect(getTier(4_999_999)).toBe(4);
  });

  it('returns correct tier for exact boundary at €1M', () => {
    expect(getTier(1_000_000)).toBe(4);
    expect(getTier(999_999)).toBe(5);
  });
});
