'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, MessageSquareWarning } from 'lucide-react';
import type { StatementOcrResult } from '@/lib/ai/ocr';

interface ParseResultsProps {
  data: StatementOcrResult;
  onConfirm: (edited: StatementOcrResult) => void;
}

function confidenceColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function confidenceBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function ConfidenceIcon({ score }: { score: number }) {
  if (score >= 80) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (score >= 50) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

function FieldRow({
  label,
  value,
  confidence,
  onChange,
  suffix,
  type = 'text',
}: {
  label: string;
  value: string | number;
  confidence: number;
  onChange: (val: string) => void;
  suffix?: string;
  type?: 'text' | 'number';
}) {
  const isLow = confidence < 50;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isLow ? 'bg-red-50/50 border-red-200' : 'bg-white border-gray-200'}`}>
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:border-transparent outline-none"
          />
          {suffix && <span className="text-xs text-gray-400 shrink-0">{suffix}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0" title={`Confidence: ${confidence}%`}>
        <ConfidenceIcon score={confidence} />
        <span className={`text-xs font-medium ${confidenceColor(confidence)}`}>
          {confidence}%
        </span>
      </div>
    </div>
  );
}

export default function ParseResults({ data, onConfirm }: ParseResultsProps) {
  const [edited, setEdited] = useState<StatementOcrResult>({ ...data });

  function updateField<K extends keyof StatementOcrResult>(key: K, value: StatementOcrResult[K]) {
    setEdited((prev) => ({ ...prev, [key]: value }));
  }

  function updateCardMix(card: keyof StatementOcrResult['cardMix'], val: number) {
    setEdited((prev) => ({
      ...prev,
      cardMix: { ...prev.cardMix, [card]: val },
    }));
  }

  function getConfidence(field: string): number {
    return edited.confidence?.fields?.[field] ?? edited.confidence?.overall ?? 0;
  }

  const lowConfidenceCount = Object.values(edited.confidence?.fields || {}).filter(
    (v) => v < 50
  ).length;

  return (
    <div className="space-y-6">
      {/* Overall confidence */}
      <div className={`p-4 rounded-xl border ${confidenceBg(edited.confidence.overall)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ConfidenceIcon score={edited.confidence.overall} />
            <span className="text-sm font-semibold text-gray-900">
              Overall Confidence
            </span>
          </div>
          <span className={`text-lg font-bold ${confidenceColor(edited.confidence.overall)}`}>
            {edited.confidence.overall}%
          </span>
        </div>
        {lowConfidenceCount > 0 && (
          <p className="mt-2 text-xs text-amber-700 flex items-center gap-1.5">
            <MessageSquareWarning className="w-3.5 h-3.5" />
            {lowConfidenceCount} field{lowConfidenceCount > 1 ? 's' : ''} with low confidence — please review highlighted fields
          </p>
        )}
      </div>

      {/* Merchant Info */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Merchant Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldRow
            label="Merchant Name"
            value={edited.merchantName}
            confidence={getConfidence('merchantName')}
            onChange={(v) => updateField('merchantName', v)}
          />
          <FieldRow
            label="Processor"
            value={edited.processorName}
            confidence={getConfidence('processorName')}
            onChange={(v) => updateField('processorName', v)}
          />
          <FieldRow
            label="Statement Period"
            value={edited.period}
            confidence={getConfidence('period')}
            onChange={(v) => updateField('period', v)}
          />
        </div>
      </div>

      {/* Volume & Transactions */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Volume & Transactions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldRow
            label="Annual Volume"
            value={edited.annualVolume}
            confidence={getConfidence('annualVolume')}
            onChange={(v) => updateField('annualVolume', parseFloat(v) || 0)}
            type="number"
            suffix="EUR"
          />
          <FieldRow
            label="Monthly Volume"
            value={edited.monthlyVolume}
            confidence={getConfidence('monthlyVolume')}
            onChange={(v) => updateField('monthlyVolume', parseFloat(v) || 0)}
            type="number"
            suffix="EUR"
          />
          <FieldRow
            label="Transaction Count (Annual)"
            value={edited.transactionCount}
            confidence={getConfidence('transactionCount')}
            onChange={(v) => updateField('transactionCount', parseInt(v) || 0)}
            type="number"
          />
          <FieldRow
            label="Avg Transaction Size"
            value={edited.avgTransactionSize}
            confidence={getConfidence('avgTransactionSize')}
            onChange={(v) => updateField('avgTransactionSize', parseFloat(v) || 0)}
            type="number"
            suffix="EUR"
          />
        </div>
      </div>

      {/* Fees */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Current Fees
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FieldRow
            label="Blended Rate"
            value={edited.blendedRate}
            confidence={getConfidence('blendedRate')}
            onChange={(v) => updateField('blendedRate', parseFloat(v) || 0)}
            type="number"
            suffix="bps"
          />
          <FieldRow
            label="Transaction Fee"
            value={edited.transactionFee}
            confidence={getConfidence('transactionFee')}
            onChange={(v) => updateField('transactionFee', parseFloat(v) || 0)}
            type="number"
            suffix="EUR"
          />
          <FieldRow
            label="Monthly Fee"
            value={edited.monthlyFee}
            confidence={getConfidence('monthlyFee')}
            onChange={(v) => updateField('monthlyFee', parseFloat(v) || 0)}
            type="number"
            suffix="EUR"
          />
        </div>
      </div>

      {/* Card Mix */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Card Mix
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['visa', 'mastercard', 'amex', 'other'] as const).map((card) => (
            <div key={card} className="bg-white border border-gray-200 rounded-lg p-3">
              <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                {card}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={edited.cardMix[card]}
                  onChange={(e) => updateCardMix(card, parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:border-transparent outline-none"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>
          ))}
        </div>
        {/* Card mix total */}
        {(() => {
          const total = edited.cardMix.visa + edited.cardMix.mastercard + edited.cardMix.amex + edited.cardMix.other;
          const isOk = total >= 98 && total <= 102;
          return (
            <p className={`mt-2 text-xs ${isOk ? 'text-gray-400' : 'text-amber-600 font-medium'}`}>
              Total: {total.toFixed(1)}%{!isOk && ' (should sum to ~100%)'}
            </p>
          );
        })()}
      </div>

      {/* International */}
      <FieldRow
        label="International Card %"
        value={edited.internationalPercent}
        confidence={getConfidence('internationalPercent')}
        onChange={(v) => updateField('internationalPercent', parseFloat(v) || 0)}
        type="number"
        suffix="%"
      />

      {/* Raw notes */}
      {edited.rawNotes && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            AI Notes
          </h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{edited.rawNotes}</p>
        </div>
      )}

      {/* Confirm button */}
      <button
        type="button"
        onClick={() => onConfirm(edited)}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-800 rounded-xl hover:bg-emerald-700 transition-colors"
      >
        Use These Values
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
