'use client';

import { BarChart3 } from 'lucide-react';

export interface VolumeDataData {
  annualVolume: number;
  avgTransactionSize: number;
}

interface VolumeDataProps {
  data: VolumeDataData;
  onChange: (data: Partial<VolumeDataData>) => void;
}

function formatDisplay(value: number): string {
  if (!value) return '';
  return new Intl.NumberFormat('en-IE').format(value);
}

function parseNumericInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  return Number(cleaned) || 0;
}

export default function VolumeData({ data, onChange }: VolumeDataProps) {
  const txCount = data.avgTransactionSize > 0
    ? Math.round(data.annualVolume / data.avgTransactionSize)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Volume Data</h2>
          <p className="text-sm text-gray-500">Annual card processing volume and transaction details</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Annual Volume */}
        <div>
          <label htmlFor="annualVolume" className="block text-sm font-medium text-gray-700 mb-1.5">
            Annual Card Volume (EUR) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">EUR</span>
            <input
              id="annualVolume"
              type="text"
              inputMode="numeric"
              value={data.annualVolume ? formatDisplay(data.annualVolume) : ''}
              onChange={(e) => onChange({ annualVolume: parseNumericInput(e.target.value) })}
              placeholder="0"
              className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            Total annual card payment volume processed across all properties
          </p>
        </div>

        {/* Average Transaction Size */}
        <div>
          <label htmlFor="avgTxSize" className="block text-sm font-medium text-gray-700 mb-1.5">
            Average Transaction Size (EUR) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">EUR</span>
            <input
              id="avgTxSize"
              type="text"
              inputMode="numeric"
              value={data.avgTransactionSize ? formatDisplay(data.avgTransactionSize) : ''}
              onChange={(e) => onChange({ avgTransactionSize: parseNumericInput(e.target.value) })}
              placeholder="0"
              className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            Average value of a single card transaction (typically between EUR 80-250 for hotels)
          </p>
        </div>

        {/* Derived info */}
        {data.annualVolume > 0 && data.avgTransactionSize > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estimated Metrics</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Annual Transactions</span>
                <div className="font-semibold text-gray-900">{new Intl.NumberFormat('en-IE').format(txCount)}</div>
              </div>
              <div>
                <span className="text-gray-500">Monthly Volume</span>
                <div className="font-semibold text-gray-900">EUR {formatDisplay(Math.round(data.annualVolume / 12))}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
