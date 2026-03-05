'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PricingResult } from '@/lib/pricing';
import { createDeal } from '@/app/(dashboard)/deals/actions';

import MerchantInfo from './steps/MerchantInfo';
import VolumeData from './steps/VolumeData';
import CardMix from './steps/CardMix';
import FeeAnalysis from './steps/FeeAnalysis';
import DCCParams from './steps/DCCParams';
import Review from './steps/Review';

const STEPS = [
  { label: 'Merchant', shortLabel: 'Merchant' },
  { label: 'Volume', shortLabel: 'Volume' },
  { label: 'Card Mix', shortLabel: 'Cards' },
  { label: 'Fees', shortLabel: 'Fees' },
  { label: 'DCC', shortLabel: 'DCC' },
  { label: 'Review', shortLabel: 'Review' },
];

interface WizardFormData {
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

const initialData: WizardFormData = {
  merchantName: '',
  hotelGroup: '',
  starRating: 4,
  propertyCount: 1,
  location: '',
  annualVolume: 0,
  avgTransactionSize: 0,
  cardMix: { visa: 40, mastercard: 35, amex: 15, mbway: 0, other: 10, international: 25, corporate: 15, debit: 30 },
  currentProcessor: '',
  currentBlendedRate: 0,
  currentTxFee: 0,
  currentMonthlyFee: 0,
  dccEligible: false,
  dccUptake: 35,
  dccMarkup: 3.5,
  merchantDccShare: 1.0,
};

export default function WizardShell() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(initialData);

  const totalSteps = STEPS.length;
  const progressPercent = ((step + 1) / totalSteps) * 100;
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;

  function updateFormData(partial: Partial<WizardFormData>) {
    setFormData((prev) => ({ ...prev, ...partial }));
  }

  function goToStep(s: number) {
    if (s >= 0 && s < totalSteps) setStep(s);
  }

  function handleResearchApply(field: string, value: unknown) {
    if (field === 'cardMixInternational' || field === 'cardMixCorporate') {
      const key = field === 'cardMixInternational' ? 'international' : 'corporate';
      setFormData((prev) => ({
        ...prev,
        cardMix: { ...prev.cardMix, [key]: Number(value) },
      }));
    } else {
      updateFormData({ [field]: value } as Partial<WizardFormData>);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleSubmit(_result: PricingResult) {
    const dealData = {
      merchantName: formData.merchantName,
      hotelGroup: formData.hotelGroup || undefined,
      starRating: formData.starRating,
      propertyCount: formData.propertyCount,
      location: formData.location || undefined,
      annualVolume: formData.annualVolume,
      avgTransactionSize: formData.avgTransactionSize,
      cardMixVisa: formData.cardMix.visa,
      cardMixMastercard: formData.cardMix.mastercard,
      cardMixAmex: formData.cardMix.amex,
      cardMixMbway: formData.cardMix.mbway,
      cardMixOther: formData.cardMix.other,
      cardMixInternational: formData.cardMix.international,
      cardMixCorporate: formData.cardMix.corporate,
      cardMixDebit: formData.cardMix.debit,
      currentProcessor: formData.currentProcessor || undefined,
      currentBlendedRate: formData.currentBlendedRate || undefined,
      currentTxFee: formData.currentTxFee || undefined,
      currentMonthlyFee: formData.currentMonthlyFee || undefined,
      dccEligible: formData.dccEligible,
      dccUptake: formData.dccUptake,
      dccMarkup: formData.dccMarkup,
      merchantDccShare: formData.merchantDccShare,
      mode: 'wizard' as const,
    };

    const deal = await createDeal(dealData);
    router.push(`/deals/${deal.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => goToStep(i)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  i === step
                    ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-800/25'
                    : i < step
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  i === step ? 'text-emerald-800' : i < step ? 'text-emerald-700' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
              <span
                className={`text-xs font-medium sm:hidden ${
                  i === step ? 'text-emerald-800' : 'text-gray-400 hidden'
                }`}
              >
                {s.shortLabel}
              </span>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-800 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6">
        {step === 0 && (
          <MerchantInfo
            data={{
              merchantName: formData.merchantName,
              hotelGroup: formData.hotelGroup,
              starRating: formData.starRating,
              propertyCount: formData.propertyCount,
              location: formData.location,
            }}
            onChange={updateFormData}
            onResearchApply={handleResearchApply}
          />
        )}

        {step === 1 && (
          <VolumeData
            data={{
              annualVolume: formData.annualVolume,
              avgTransactionSize: formData.avgTransactionSize,
            }}
            onChange={updateFormData}
          />
        )}

        {step === 2 && (
          <CardMix
            data={{ cardMix: formData.cardMix }}
            onChange={(d) => {
              if (d.cardMix) updateFormData({ cardMix: d.cardMix });
            }}
          />
        )}

        {step === 3 && (
          <FeeAnalysis
            data={{
              currentProcessor: formData.currentProcessor,
              currentBlendedRate: formData.currentBlendedRate,
              currentTxFee: formData.currentTxFee,
              currentMonthlyFee: formData.currentMonthlyFee,
            }}
            onChange={updateFormData}
          />
        )}

        {step === 4 && (
          <DCCParams
            data={{
              dccEligible: formData.dccEligible,
              dccUptake: formData.dccUptake,
              dccMarkup: formData.dccMarkup,
              merchantDccShare: formData.merchantDccShare,
              annualVolume: formData.annualVolume,
              cardMixInternational: formData.cardMix.international,
            }}
            onChange={updateFormData}
          />
        )}

        {step === 5 && (
          <Review
            data={formData}
            onGoToStep={goToStep}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Navigation */}
      {!isLast && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToStep(step - 1)}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-sm text-gray-400">
            Step {step + 1} of {totalSteps}
          </span>

          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-emerald-800 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLast && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToStep(step - 1)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-sm text-gray-400">
            Step {step + 1} of {totalSteps}
          </span>

          <div /> {/* spacer — submit is handled inside Review */}
        </div>
      )}
    </div>
  );
}
