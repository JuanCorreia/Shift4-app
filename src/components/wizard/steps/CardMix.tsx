'use client';

import { CreditCard } from 'lucide-react';
import type { CardMix as CardMixType } from '@/lib/pricing';

export interface CardMixData {
  cardMix: CardMixType;
}

interface CardMixProps {
  data: CardMixData;
  onChange: (data: Partial<CardMixData>) => void;
}

const BRAND_COLORS: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#006FCF',
  mbway: '#E4002B',
  other: '#6B7280',
};

interface SliderRowProps {
  label: string;
  field: string;
  value: number;
  color: string;
  onChange: (field: string, value: number) => void;
}

function SliderRow({ label, field, value, color, onChange }: SliderRowProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(field, Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value}%, #E5E7EB ${value}%)`,
        }}
      />
      <div className="w-20 flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(field, Math.min(100, Math.max(0, Number(e.target.value))))}
          className="w-14 px-2 py-1 text-sm text-right bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700"
        />
        <span className="text-sm text-gray-400">%</span>
      </div>
    </div>
  );
}

export default function CardMix({ data, onChange }: CardMixProps) {
  const mix = data.cardMix;
  const brandTotal = mix.visa + mix.mastercard + mix.amex + mix.mbway + mix.other;
  const totalValid = brandTotal === 100;

  function handleBrandChange(field: string, value: number) {
    onChange({
      cardMix: { ...mix, [field]: value },
    });
  }

  function handleSecondaryChange(field: string, value: number) {
    onChange({
      cardMix: { ...mix, [field]: value },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Card Mix</h2>
          <p className="text-sm text-gray-500">Breakdown of card brands and transaction types</p>
        </div>
      </div>

      {/* Brand mix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Brand Distribution</h3>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${totalValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            Total: {brandTotal}%
          </span>
        </div>

        <div className="space-y-3">
          <SliderRow label="Visa" field="visa" value={mix.visa} color={BRAND_COLORS.visa} onChange={handleBrandChange} />
          <SliderRow label="Mastercard" field="mastercard" value={mix.mastercard} color={BRAND_COLORS.mastercard} onChange={handleBrandChange} />
          <SliderRow label="Amex" field="amex" value={mix.amex} color={BRAND_COLORS.amex} onChange={handleBrandChange} />
          <SliderRow label="MBWay" field="mbway" value={mix.mbway} color={BRAND_COLORS.mbway} onChange={handleBrandChange} />
          <SliderRow label="Other" field="other" value={mix.other} color={BRAND_COLORS.other} onChange={handleBrandChange} />
        </div>

        {!totalValid && (
          <p className="text-xs text-red-600 font-medium">
            Brand percentages must total exactly 100%. Currently {brandTotal}%.
          </p>
        )}

        {/* Visual bar */}
        <div className="h-4 w-full flex rounded-full overflow-hidden bg-gray-200">
          {mix.visa > 0 && (
            <div style={{ width: `${mix.visa}%`, backgroundColor: BRAND_COLORS.visa }} className="transition-all duration-200" />
          )}
          {mix.mastercard > 0 && (
            <div style={{ width: `${mix.mastercard}%`, backgroundColor: BRAND_COLORS.mastercard }} className="transition-all duration-200" />
          )}
          {mix.amex > 0 && (
            <div style={{ width: `${mix.amex}%`, backgroundColor: BRAND_COLORS.amex }} className="transition-all duration-200" />
          )}
          {mix.mbway > 0 && (
            <div style={{ width: `${mix.mbway}%`, backgroundColor: BRAND_COLORS.mbway }} className="transition-all duration-200" />
          )}
          {mix.other > 0 && (
            <div style={{ width: `${mix.other}%`, backgroundColor: BRAND_COLORS.other }} className="transition-all duration-200" />
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS.visa }} /> Visa {mix.visa}%</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS.mastercard }} /> Mastercard {mix.mastercard}%</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS.amex }} /> Amex {mix.amex}%</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS.mbway }} /> MBWay {mix.mbway}%</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS.other }} /> Other {mix.other}%</span>
        </div>
      </div>

      {/* Secondary percentages */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Transaction Characteristics</h3>
        <div className="space-y-3">
          <SliderRow label="International" field="international" value={mix.international} color="#8B5CF6" onChange={handleSecondaryChange} />
          <SliderRow label="Corporate" field="corporate" value={mix.corporate} color="#0891B2" onChange={handleSecondaryChange} />
          <SliderRow label="Debit" field="debit" value={mix.debit} color="#059669" onChange={handleSecondaryChange} />
        </div>
        <p className="text-xs text-gray-400">
          These percentages are independent of each other and the brand distribution above.
        </p>
      </div>
    </div>
  );
}
