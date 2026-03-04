import type { PricingInput, PricingResult, Escalation } from './types';
import { getTierDefinition } from './tiers';

export function generateEscalations(
  input: PricingInput,
  result: Omit<PricingResult, 'escalations'>
): Escalation[] {
  const escalations: Escalation[] = [];
  const tierDef = getTierDefinition(result.tier);

  // TIER1_REVIEW: Tier 1 deals always need senior review
  if (result.tier === 1) {
    escalations.push({
      code: 'TIER1_REVIEW',
      severity: 'critical',
      message: 'Tier 1 deal requires senior management review',
      details: `Annual volume: €${(input.annualVolume / 1_000_000).toFixed(1)}M`,
    });
  }

  // BELOW_FLOOR: adjusted rate < 80% of tier base rate
  const floorRate = tierDef.baseRate * 0.8;
  if (result.adjustedRate < floorRate) {
    escalations.push({
      code: 'BELOW_FLOOR',
      severity: 'critical',
      message: 'Proposed rate is below the tier floor',
      details: `Adjusted rate ${result.adjustedRate.toFixed(1)}bps is below floor of ${floorRate.toFixed(1)}bps (80% of ${tierDef.baseRate}bps base)`,
    });
  }

  // HEAVY_AMEX: amex > 25%
  if (input.cardMix.amex > 25) {
    escalations.push({
      code: 'HEAVY_AMEX',
      severity: 'warning',
      message: 'High Amex card mix may impact margins',
      details: `Amex at ${input.cardMix.amex}% of total volume (threshold: 25%)`,
    });
  }

  // NEGATIVE_SAVINGS: savings < 0
  if (result.annualSavings < 0) {
    escalations.push({
      code: 'NEGATIVE_SAVINGS',
      severity: 'critical',
      message: 'Proposed pricing is more expensive than current',
      details: `Annual cost increase: €${Math.abs(result.annualSavings).toFixed(2)}`,
    });
  }

  // LOW_MARGIN: margin < 5bps (critical if < 0)
  if (result.marginEstimate.margin < 0) {
    escalations.push({
      code: 'LOW_MARGIN',
      severity: 'critical',
      message: 'Negative margin — deal is loss-making',
      details: `Margin: ${result.marginEstimate.margin.toFixed(2)}bps`,
    });
  } else if (result.marginEstimate.margin < 5) {
    escalations.push({
      code: 'LOW_MARGIN',
      severity: 'warning',
      message: 'Margin is below healthy threshold',
      details: `Margin: ${result.marginEstimate.margin.toFixed(2)}bps (minimum recommended: 5bps)`,
    });
  }

  // UNREALISTIC_DCC: dccUptake > 60%
  if (input.dccEligible && input.dccUptake > 60) {
    escalations.push({
      code: 'UNREALISTIC_DCC',
      severity: 'warning',
      message: 'DCC uptake assumption may be unrealistic',
      details: `Projected uptake: ${input.dccUptake}% (typical max: 60%)`,
    });
  }

  // HIGH_INTERNATIONAL: international > 50%
  if (input.cardMix.international > 50) {
    escalations.push({
      code: 'HIGH_INTERNATIONAL',
      severity: 'warning',
      message: 'High international card mix noted',
      details: `International: ${input.cardMix.international}% of total volume`,
    });
  }

  // LARGE_DEAL: volume > €50M
  if (input.annualVolume > 50_000_000) {
    escalations.push({
      code: 'LARGE_DEAL',
      severity: 'warning',
      message: 'Large deal — ensure commercial team approval',
      details: `Annual volume: €${(input.annualVolume / 1_000_000).toFixed(1)}M`,
    });
  }

  return escalations;
}
