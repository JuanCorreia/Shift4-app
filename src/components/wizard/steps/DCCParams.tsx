'use client';

import { Globe, Info } from 'lucide-react';

export interface DCCParamsData {
  dccEligible: boolean;
  dccUptake: number;
  dccMarkup: number;
  annualVolume: number;
  cardMixInternational: number;
}

interface DCCParamsProps {
  data: DCCParamsData;
  onChange: (data: Partial<Pick<DCCParamsData, 'dccEligible' | 'dccUptake' | 'dccMarkup'>>) => void;
}

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DCCParams({ data, onChange }: DCCParamsProps) {
  const eligibleVolume = data.annualVolume * (data.cardMixInternational / 100);
  const projectedUptake = eligibleVolume * (data.dccUptake / 100);
  const annualRevenue = projectedUptake * (data.dccMarkup / 100);
  const merchantShare = annualRevenue * 0.5;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">DCC Parameters</h2>
          <p className="text-sm text-gray-500">Dynamic Currency Conversion settings for international transactions</p>
        </div>
      </div>

      {/* DCC Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <div className="text-sm font-medium text-gray-900">DCC Eligible</div>
          <div className="text-xs text-gray-500 mt-0.5">Does this merchant qualify for Dynamic Currency Conversion?</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={data.dccEligible}
          onClick={() => onChange({ dccEligible: !data.dccEligible })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.dccEligible ? 'bg-purple-600' : 'bg-gray-300'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.dccEligible ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>

      {data.dccEligible && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* DCC Uptake */}
          <div>
            <label htmlFor="dccUptake" className="block text-sm font-medium text-gray-700 mb-1.5">
              DCC Uptake Rate
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={data.dccUptake}
                onChange={(e) => onChange({ dccUptake: Number(e.target.value) })}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #7C3AED ${data.dccUptake}%, #E5E7EB ${data.dccUptake}%)`,
                }}
              />
              <div className="w-20 flex items-center gap-1">
                <input
                  id="dccUptake"
                  type="number"
                  min={0}
                  max={100}
                  value={data.dccUptake}
                  onChange={(e) => onChange({ dccUptake: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  className="w-14 px-2 py-1 text-sm text-right bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Percentage of eligible international transactions that will opt-in to DCC (typical: 30-45%)
            </p>
          </div>

          {/* DCC Markup */}
          <div>
            <label htmlFor="dccMarkup" className="block text-sm font-medium text-gray-700 mb-1.5">
              DCC Markup
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={data.dccMarkup}
                onChange={(e) => onChange({ dccMarkup: Number(e.target.value) })}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #7C3AED ${(data.dccMarkup / 5) * 100}%, #E5E7EB ${(data.dccMarkup / 5) * 100}%)`,
                }}
              />
              <div className="w-20 flex items-center gap-1">
                <input
                  id="dccMarkup"
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={data.dccMarkup}
                  onChange={(e) => onChange({ dccMarkup: Math.min(5, Math.max(0, Number(e.target.value))) })}
                  className="w-14 px-2 py-1 text-sm text-right bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Currency conversion markup applied to DCC transactions (standard: 2.5%)
            </p>
          </div>

          {/* Revenue Preview */}
          {data.annualVolume > 0 && data.cardMixInternational > 0 && (
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Projected DCC Revenue</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-purple-600">Eligible Volume</div>
                  <div className="font-semibold text-purple-900">{fmt(eligibleVolume)}</div>
                </div>
                <div>
                  <div className="text-purple-600">Projected Uptake</div>
                  <div className="font-semibold text-purple-900">{fmt(projectedUptake)}</div>
                </div>
                <div>
                  <div className="text-purple-600">Total Revenue</div>
                  <div className="font-semibold text-purple-900">{fmt(annualRevenue)}</div>
                </div>
                <div>
                  <div className="text-purple-600">Merchant Share (50%)</div>
                  <div className="font-bold text-purple-900">{fmt(merchantShare)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
