'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileUp,
  Brain,
  ClipboardCheck,
  Calculator,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import UploadZone from '@/components/statement/UploadZone';
import ParseResults from '@/components/statement/ParseResults';
import PricingBreakdown from '@/components/pricing/PricingBreakdown';
import type { StatementOcrResult } from '@/lib/ai/ocr';
import type { PricingInput, PricingResult } from '@/lib/pricing';
import { calculatePricing } from '@/lib/pricing/engine';
import { createDeal } from '@/app/(dashboard)/deals/actions';

type FlowStep = 'upload' | 'processing' | 'review' | 'pricing' | 'complete';

const STEP_META: { key: FlowStep; label: string; icon: React.ElementType }[] = [
  { key: 'upload', label: 'Upload', icon: FileUp },
  { key: 'processing', label: 'AI Analysis', icon: Brain },
  { key: 'review', label: 'Review', icon: ClipboardCheck },
  { key: 'pricing', label: 'Pricing', icon: Calculator },
  { key: 'complete', label: 'Create Deal', icon: CheckCircle2 },
];

export default function StatementPage() {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>('upload');
  const [, setUploadData] = useState<{ url: string; path: string; base64: string } | null>(null);
  const [ocrResult, setOcrResult] = useState<StatementOcrResult | null>(null);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [confirmedData, setConfirmedData] = useState<StatementOcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const currentStepIndex = STEP_META.findIndex((s) => s.key === step);

  async function handleUploadComplete(data: { url: string; path: string; base64: string }) {
    setUploadData(data);
    setError(null);
    setStep('processing');

    try {
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: data.base64 }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'OCR processing failed');
      }

      const result: StatementOcrResult = await res.json();
      setOcrResult(result);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR processing failed');
      setStep('upload');
    }
  }

  function handleReviewConfirm(edited: StatementOcrResult) {
    setConfirmedData(edited);

    // Build PricingInput from OCR data
    const pricingInput: PricingInput = {
      merchantName: edited.merchantName,
      annualVolume: edited.annualVolume,
      avgTransactionSize: edited.avgTransactionSize,
      cardMix: {
        visa: edited.cardMix.visa,
        mastercard: edited.cardMix.mastercard,
        amex: edited.cardMix.amex,
        mbway: 0,
        other: edited.cardMix.other,
        international: edited.internationalPercent,
        corporate: 15, // default estimate
        debit: 30, // default estimate
      },
      currentBlendedRate: edited.blendedRate,
      currentTxFee: edited.transactionFee,
      currentMonthlyFee: edited.monthlyFee,
      dccEligible: edited.internationalPercent >= 10,
      dccUptake: 35,
      dccMarkup: 3.5,
      merchantDccShare: 1.0,
      propertyCount: 1,
      starRating: 4,
    };

    const result = calculatePricing(pricingInput);
    setPricingResult(result);
    setStep('pricing');
  }

  async function handleCreateDeal() {
    if (!confirmedData || !pricingResult) return;
    setCreating(true);
    setError(null);

    try {
      const deal = await createDeal({
        merchantName: confirmedData.merchantName,
        annualVolume: confirmedData.annualVolume,
        avgTransactionSize: confirmedData.avgTransactionSize,
        cardMixVisa: confirmedData.cardMix.visa,
        cardMixMastercard: confirmedData.cardMix.mastercard,
        cardMixAmex: confirmedData.cardMix.amex,
        cardMixMbway: 0,
        cardMixOther: confirmedData.cardMix.other,
        cardMixInternational: confirmedData.internationalPercent,
        cardMixCorporate: 15,
        cardMixDebit: 30,
        currentProcessor: confirmedData.processorName || undefined,
        currentBlendedRate: confirmedData.blendedRate || undefined,
        currentTxFee: confirmedData.transactionFee || undefined,
        currentMonthlyFee: confirmedData.monthlyFee || undefined,
        dccEligible: confirmedData.internationalPercent >= 10,
        dccUptake: 35,
        dccMarkup: 3.5,
        merchantDccShare: 1.0,
        mode: 'statement' as const,
      });

      setStep('complete');
      router.push(`/deals/${deal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deal');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/deals/new"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Mode Selection
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Statement Upload</h1>
        <p className="text-gray-500 mt-1">
          Upload a merchant statement for AI-powered analysis and instant pricing
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEP_META.map((s, i) => {
            const Icon = s.icon;
            const isCurrent = i === currentStepIndex;
            const isPast = i < currentStepIndex;
            return (
              <div key={s.key} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-800/25'
                      : isPast
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    isCurrent ? 'text-emerald-800' : isPast ? 'text-emerald-700' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-800 rounded-full transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / STEP_META.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6">
        {/* Upload step */}
        {step === 'upload' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Statement PDF</h2>
            <p className="text-sm text-gray-500 mb-6">
              Upload the merchant&apos;s current processing statement. We support statements from all major processors.
            </p>
            <UploadZone onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {/* Processing step */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-emerald-800" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Loader2 className="w-4 h-4 text-emerald-800 animate-spin" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Statement</h2>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              AI is extracting merchant data, volumes, fees, and card mix from the uploaded statement. This usually takes 10-30 seconds.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-800 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 bg-emerald-800 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-emerald-800 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Review step */}
        {step === 'review' && ocrResult && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Review Extracted Data</h2>
            <p className="text-sm text-gray-500 mb-6">
              Review and correct the AI-extracted values. Low-confidence fields are highlighted for your attention.
            </p>
            <ParseResults data={ocrResult} onConfirm={handleReviewConfirm} />
          </div>
        )}

        {/* Pricing step */}
        {step === 'pricing' && pricingResult && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Pricing Results</h2>
            <p className="text-sm text-gray-500 mb-6">
              Based on the extracted statement data, here is the Banyan pricing proposal.
            </p>
            <PricingBreakdown result={pricingResult} />

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleCreateDeal}
                disabled={creating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-800 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Deal...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Create Deal
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('review')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Review
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Something went wrong</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Step context footer */}
      {step === 'upload' && (
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Supported: Worldpay, Adyen, Stripe, Global Payments, Elavon, First Data, and most ISO statements
          </p>
        </div>
      )}
    </div>
  );
}
