'use client';

import { TrendingDown, TrendingUp, Euro, Activity, AlertTriangle } from 'lucide-react';
import type { PricingResult } from '@/lib/pricing';
import TierIndicator from './TierIndicator';
import EscalationPanel from './EscalationPanel';

interface PricingBreakdownProps {
  result: PricingResult;
}

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtBps(value: number): string {
  return `${value.toFixed(1)}bps`;
}

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function PricingBreakdown({ result }: PricingBreakdownProps) {
  const savingsPositive = result.annualSavings >= 0;
  const criticalEscalations = result.escalations.filter((e) => e.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Critical escalation banner */}
      {criticalEscalations.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {criticalEscalations.map((e) => (
              <p key={e.code} className="text-sm font-medium text-red-800">{e.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* Tier + Savings headline */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <TierIndicator tier={result.tier} tierName={result.tierName} size="lg" />

        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Annual Savings</div>
          <div className={`text-3xl font-bold ${savingsPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {fmt(result.annualSavings)}
          </div>
          <div className={`text-sm font-medium ${savingsPositive ? 'text-emerald-500' : 'text-red-500'} flex items-center justify-end gap-1`}>
            {savingsPositive ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {fmtPct(Math.abs(result.savingsPercent))} {savingsPositive ? 'reduction' : 'increase'}
          </div>
        </div>
      </div>

      {/* Current vs Proposed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Current Costs</div>
          <div className="text-2xl font-bold text-gray-900 mb-4">{fmt(result.annualCostCurrent)}</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Blended Rate</span>
              <span className="font-medium text-gray-900">—</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-4">Proposed Costs</div>
          <div className="text-2xl font-bold text-emerald-900 mb-4">{fmt(result.annualCostProposed)}</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-emerald-800">
              <span>Adjusted Rate</span>
              <span className="font-medium">{fmtBps(result.adjustedRate)}</span>
            </div>
            <div className="flex justify-between text-emerald-800">
              <span>Transaction Fee</span>
              <span className="font-medium">{fmt(result.proposedTxFee)}</span>
            </div>
            <div className="flex justify-between text-emerald-800">
              <span>Monthly Fee</span>
              <span className="font-medium">{fmt(result.proposedMonthlyFee)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rate breakdown */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Rate Breakdown</div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Base Rate (Tier {result.tier})</span>
            <span className="font-semibold text-gray-900">{fmtBps(result.baseRate)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Card Mix Adjustments</span>
            <span className={`font-semibold ${result.adjustedRate - result.baseRate >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {result.adjustedRate - result.baseRate >= 0 ? '+' : ''}{fmtBps(result.adjustedRate - result.baseRate)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-900">Final Rate</span>
            <span className="font-bold text-gray-900">{fmtBps(result.adjustedRate)}</span>
          </div>
        </div>
      </div>

      {/* DCC Revenue */}
      {result.dccRevenue && (
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Euro className="w-4 h-4 text-purple-600" />
            <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">DCC Revenue</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-purple-600">Eligible Volume</div>
              <div className="font-semibold text-purple-900">{fmt(result.dccRevenue.eligibleVolume)}</div>
            </div>
            <div>
              <div className="text-purple-600">Projected Uptake</div>
              <div className="font-semibold text-purple-900">{fmt(result.dccRevenue.projectedUptake)}</div>
            </div>
            <div>
              <div className="text-purple-600">Merchant Share</div>
              <div className="font-semibold text-purple-900">{fmt(result.dccRevenue.revenueShareMerchant)}</div>
            </div>
            <div>
              <div className="text-purple-600">Shift4 Share</div>
              <div className="font-semibold text-purple-900">{fmt(result.dccRevenue.revenueShareShift4)}</div>
            </div>
            <div>
              <div className="text-purple-600">Host Share</div>
              <div className="font-semibold text-purple-900">{fmt(result.dccRevenue.revenueShareHost)}</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-purple-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-purple-700">Total Annual Revenue</span>
            <span className="text-lg font-bold text-purple-900">{fmt(result.dccRevenue.annualRevenue)}</span>
          </div>
        </div>
      )}

      {/* Margin health */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-gray-600" />
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Margin Health</div>
        </div>
        <div className="flex items-center gap-4 mb-3">
          <div className={`w-3 h-3 rounded-full ${result.marginEstimate.healthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className={`text-sm font-semibold ${result.marginEstimate.healthy ? 'text-emerald-700' : 'text-red-700'}`}>
            {result.marginEstimate.healthy ? 'Healthy' : 'Unhealthy'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Interchange</div>
            <div className="font-semibold">{fmtBps(result.marginEstimate.interchangeCost)}</div>
          </div>
          <div>
            <div className="text-gray-500">Scheme Fees</div>
            <div className="font-semibold">{fmtBps(result.marginEstimate.schemeFees)}</div>
          </div>
          <div>
            <div className="text-gray-500">Total Cost</div>
            <div className="font-semibold">{fmtBps(result.marginEstimate.totalCost)}</div>
          </div>
          <div>
            <div className="text-gray-500">Margin</div>
            <div className={`font-semibold ${result.marginEstimate.healthy ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmtBps(result.marginEstimate.margin)} ({fmtPct(result.marginEstimate.marginPercent)})
            </div>
          </div>
        </div>
      </div>

      {/* Escalations */}
      {result.escalations.length > 0 && (
        <EscalationPanel escalations={result.escalations} />
      )}
    </div>
  );
}
