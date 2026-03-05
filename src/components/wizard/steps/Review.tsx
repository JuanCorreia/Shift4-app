'use client';

import { useState } from 'react';
import { Calculator, Save, Pencil, Building2, BarChart3, CreditCard, Receipt, Globe, Loader2 } from 'lucide-react';
import { calculatePricing } from '@/lib/pricing';
import type { PricingInput, PricingResult } from '@/lib/pricing';
import PricingBreakdown from '@/components/pricing/PricingBreakdown';

interface WizardData {
  merchantName: string;
  hotelGroup: string;
  starRating: number;
  propertyCount: number;
  location: string;
  annualVolume: number;
  avgTransactionSize: number;
  cardMix: {
    visa: number;
    mastercard: number;
    amex: number;
    mbway: number;
    other: number;
    international: number;
    corporate: number;
    debit: number;
  };
  currentProcessor: string;
  currentBlendedRate: number;
  currentTxFee: number;
  currentMonthlyFee: number;
  dccEligible: boolean;
  dccUptake: number;
  dccMarkup: number;
  merchantDccShare: number;
}

interface ReviewProps {
  data: WizardData;
  onGoToStep: (step: number) => void;
  onSubmit: (result: PricingResult) => Promise<void>;
}

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function SummarySection({
  title,
  icon: Icon,
  step,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ElementType;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-700 font-medium"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}

export default function Review({ data, onGoToStep, onSubmit }: ReviewProps) {
  const [result, setResult] = useState<PricingResult | null>(null);
  const [saving, setSaving] = useState(false);

  const brandTotal = data.cardMix.visa + data.cardMix.mastercard + data.cardMix.amex + data.cardMix.mbway + data.cardMix.other;

  function handleCalculate() {
    const input: PricingInput = {
      merchantName: data.merchantName,
      annualVolume: data.annualVolume,
      avgTransactionSize: data.avgTransactionSize,
      cardMix: data.cardMix,
      currentBlendedRate: data.currentBlendedRate,
      currentTxFee: data.currentTxFee,
      currentMonthlyFee: data.currentMonthlyFee,
      dccEligible: data.dccEligible,
      dccUptake: data.dccUptake,
      dccMarkup: data.dccMarkup,
      merchantDccShare: data.merchantDccShare,
      propertyCount: data.propertyCount,
      starRating: data.starRating,
    };
    setResult(calculatePricing(input));
  }

  async function handleSubmit() {
    if (!result) return;
    setSaving(true);
    try {
      await onSubmit(result);
    } finally {
      setSaving(false);
    }
  }

  const canCalculate = data.merchantName && data.annualVolume > 0 && data.avgTransactionSize > 0 && brandTotal === 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review & Calculate</h2>
        <p className="text-sm text-gray-500">Verify all information, then calculate pricing</p>
      </div>

      {/* Summary sections */}
      <div className="space-y-4">
        <SummarySection title="Merchant Information" icon={Building2} step={0} onEdit={onGoToStep}>
          <DataRow label="Merchant Name" value={data.merchantName} />
          <DataRow label="Hotel Group" value={data.hotelGroup} />
          <DataRow label="Star Rating" value={data.starRating ? `${'★'.repeat(data.starRating)} (${data.starRating})` : '—'} />
          <DataRow label="Properties" value={data.propertyCount} />
          <DataRow label="Location" value={data.location} />
        </SummarySection>

        <SummarySection title="Volume Data" icon={BarChart3} step={1} onEdit={onGoToStep}>
          <DataRow label="Annual Volume" value={fmt(data.annualVolume)} />
          <DataRow label="Avg Transaction" value={fmt(data.avgTransactionSize)} />
          {data.avgTransactionSize > 0 && (
            <DataRow
              label="Est. Transactions"
              value={new Intl.NumberFormat('en-IE').format(Math.round(data.annualVolume / data.avgTransactionSize))}
            />
          )}
        </SummarySection>

        <SummarySection title="Card Mix" icon={CreditCard} step={2} onEdit={onGoToStep}>
          <DataRow label="Visa" value={`${data.cardMix.visa}%`} />
          <DataRow label="Mastercard" value={`${data.cardMix.mastercard}%`} />
          <DataRow label="Amex" value={`${data.cardMix.amex}%`} />
          <DataRow label="MBWay" value={`${data.cardMix.mbway}%`} />
          <DataRow label="Other" value={`${data.cardMix.other}%`} />
          <div className="border-t border-gray-100 mt-2 pt-2">
            <DataRow label="International" value={`${data.cardMix.international}%`} />
            <DataRow label="Corporate" value={`${data.cardMix.corporate}%`} />
            <DataRow label="Debit" value={`${data.cardMix.debit}%`} />
          </div>
          {brandTotal !== 100 && (
            <p className="mt-2 text-xs text-red-600 font-medium">
              Brand total is {brandTotal}% — must be 100%
            </p>
          )}
        </SummarySection>

        <SummarySection title="Current Fees" icon={Receipt} step={3} onEdit={onGoToStep}>
          <DataRow label="Processor" value={data.currentProcessor} />
          <DataRow label="Blended Rate" value={data.currentBlendedRate > 0 ? `${data.currentBlendedRate}bps (${(data.currentBlendedRate / 100).toFixed(2)}%)` : '—'} />
          <DataRow label="Transaction Fee" value={data.currentTxFee > 0 ? fmt(data.currentTxFee) : '—'} />
          <DataRow label="Monthly Fee" value={data.currentMonthlyFee > 0 ? fmt(data.currentMonthlyFee) : '—'} />
        </SummarySection>

        <SummarySection title="DCC Parameters" icon={Globe} step={4} onEdit={onGoToStep}>
          <DataRow label="DCC Eligible" value={data.dccEligible ? 'Yes' : 'No'} />
          {data.dccEligible && (
            <>
              <DataRow label="Uptake Rate" value={`${data.dccUptake}%`} />
              <DataRow label="Markup" value={`${data.dccMarkup}%`} />
              <DataRow label="Merchant Share" value={`${data.merchantDccShare}%`} />
            </>
          )}
        </SummarySection>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleCalculate}
          disabled={!canCalculate}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-800 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Calculator className="w-5 h-5" />
          Calculate Pricing
        </button>

        {result && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Creating Deal...' : 'Create Deal'}
          </button>
        )}
      </div>

      {!canCalculate && (
        <p className="text-xs text-amber-600 font-medium">
          Please complete all required fields (merchant name, volume, transaction size) and ensure card brand mix totals 100%.
        </p>
      )}

      {/* Pricing results */}
      {result && (
        <div className="pt-6 border-t border-gray-200">
          <PricingBreakdown result={result} />
        </div>
      )}
    </div>
  );
}
