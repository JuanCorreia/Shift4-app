'use client';

import { X, Check, Globe, Building2, Star, Users, Search } from 'lucide-react';
import type { HotelResearchResult } from '@/lib/ai/research';

interface ResearchResultsProps {
  result: HotelResearchResult;
  onApply: (field: string, value: unknown) => void;
  onClose: () => void;
}

type MarketSegmentMap = {
  [K in NonNullable<HotelResearchResult['marketSegment']>]: number;
};

const SEGMENT_TO_STARS: MarketSegmentMap = {
  luxury: 5,
  upscale: 4,
  midscale: 3,
  economy: 2,
};

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${styles[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} confidence
    </span>
  );
}

interface FieldRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  fieldName: string;
  fieldValue: unknown;
  onApply: (field: string, value: unknown) => void;
}

function FieldRow({ icon, label, value, fieldName, fieldValue, onApply }: FieldRowProps) {
  if (value === null || value === undefined) return null;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-sm text-gray-900 truncate">{String(value)}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onApply(fieldName, fieldValue)}
        className="ml-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex-shrink-0"
      >
        <Check className="w-3 h-3" />
        Apply
      </button>
    </div>
  );
}

export default function ResearchResults({ result, onApply, onClose }: ResearchResultsProps) {
  function handleApplyAll() {
    if (result.propertyCount !== null) onApply('propertyCount', result.propertyCount);
    if (result.starRating !== null) onApply('starRating', result.starRating);
    if (result.locations.length > 0) onApply('location', result.locations.join(', '));
    if (result.estimatedAnnualVolume !== null) onApply('annualVolume', result.estimatedAnnualVolume);
    if (result.estimatedAvgTransaction !== null) onApply('avgTransactionSize', result.estimatedAvgTransaction);
    if (result.internationalPercent !== null) onApply('cardMixInternational', result.internationalPercent);
    if (result.corporatePercent !== null) onApply('cardMixCorporate', result.corporatePercent);
    if (result.marketSegment) {
      onApply('starRating', SEGMENT_TO_STARS[result.marketSegment]);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Research Results</h3>
              <p className="text-sm text-gray-500">{result.hotelName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConfidenceBadge level={result.confidence} />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Fields */}
          <div>
            <FieldRow
              icon={<Building2 className="w-4 h-4 text-gray-500" />}
              label="Property Count"
              value={result.propertyCount}
              fieldName="propertyCount"
              fieldValue={result.propertyCount}
              onApply={onApply}
            />
            <FieldRow
              icon={<Star className="w-4 h-4 text-gray-500" />}
              label="Star Rating"
              value={result.starRating ? `${result.starRating} Stars` : null}
              fieldName="starRating"
              fieldValue={result.starRating}
              onApply={onApply}
            />
            <FieldRow
              icon={<Globe className="w-4 h-4 text-gray-500" />}
              label="Locations"
              value={result.locations.length > 0 ? result.locations.join(', ') : null}
              fieldName="location"
              fieldValue={result.locations.join(', ')}
              onApply={onApply}
            />
            <FieldRow
              icon={<Globe className="w-4 h-4 text-gray-500" />}
              label="International Guests"
              value={result.internationalPercent !== null ? `${result.internationalPercent}%` : null}
              fieldName="cardMixInternational"
              fieldValue={result.internationalPercent}
              onApply={onApply}
            />
            <FieldRow
              icon={<Users className="w-4 h-4 text-gray-500" />}
              label="Corporate / Business Travel"
              value={result.corporatePercent !== null ? `${result.corporatePercent}%` : null}
              fieldName="cardMixCorporate"
              fieldValue={result.corporatePercent}
              onApply={onApply}
            />
            <FieldRow
              icon={<Building2 className="w-4 h-4 text-gray-500" />}
              label="Market Segment"
              value={result.marketSegment ? result.marketSegment.charAt(0).toUpperCase() + result.marketSegment.slice(1) : null}
              fieldName="starRating"
              fieldValue={result.marketSegment ? SEGMENT_TO_STARS[result.marketSegment] : null}
              onApply={onApply}
            />
            <FieldRow
              icon={<Building2 className="w-4 h-4 text-gray-500" />}
              label="Estimated Annual Volume"
              value={result.estimatedAnnualVolume !== null ? `EUR ${result.estimatedAnnualVolume.toLocaleString()}` : null}
              fieldName="annualVolume"
              fieldValue={result.estimatedAnnualVolume}
              onApply={onApply}
            />
            <FieldRow
              icon={<Building2 className="w-4 h-4 text-gray-500" />}
              label="Estimated Avg Transaction"
              value={result.estimatedAvgTransaction !== null ? `EUR ${result.estimatedAvgTransaction.toLocaleString()}` : null}
              fieldName="avgTransactionSize"
              fieldValue={result.estimatedAvgTransaction}
              onApply={onApply}
            />
          </div>

          {/* Notes */}
          {result.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.notes}</p>
            </div>
          )}

          {/* Sources */}
          {result.sources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Sources</p>
              <ul className="space-y-1">
                {result.sources.map((source, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-gray-300 mt-0.5">-</span>
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleApplyAll}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-800 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Apply All
          </button>
        </div>
      </div>
    </div>
  );
}
