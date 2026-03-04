'use client';

import { Receipt } from 'lucide-react';

export interface FeeAnalysisData {
  currentProcessor: string;
  currentBlendedRate: number;
  currentTxFee: number;
  currentMonthlyFee: number;
}

interface FeeAnalysisProps {
  data: FeeAnalysisData;
  onChange: (data: Partial<FeeAnalysisData>) => void;
}

export default function FeeAnalysis({ data, onChange }: FeeAnalysisProps) {
  const ratePercent = data.currentBlendedRate > 0 ? (data.currentBlendedRate / 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Receipt className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Current Fee Analysis</h2>
          <p className="text-sm text-gray-500">Enter current processing costs so we can calculate potential savings</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Current Processor */}
        <div>
          <label htmlFor="currentProcessor" className="block text-sm font-medium text-gray-700 mb-1.5">
            Current Processor
          </label>
          <input
            id="currentProcessor"
            type="text"
            value={data.currentProcessor}
            onChange={(e) => onChange({ currentProcessor: e.target.value })}
            placeholder="e.g. Worldpay, Adyen, Stripe"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
          />
        </div>

        {/* Blended Rate */}
        <div>
          <label htmlFor="blendedRate" className="block text-sm font-medium text-gray-700 mb-1.5">
            Current Blended Rate (basis points)
          </label>
          <div className="relative">
            <input
              id="blendedRate"
              type="number"
              min={0}
              max={500}
              step={1}
              value={data.currentBlendedRate || ''}
              onChange={(e) => onChange({ currentBlendedRate: Number(e.target.value) })}
              placeholder="e.g. 150"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all pr-20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">bps</span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {data.currentBlendedRate > 0
              ? `${ratePercent}% blended rate`
              : '100 basis points = 1.00%. For example, 150bps = 1.50%'}
          </p>
        </div>

        {/* Transaction Fee */}
        <div>
          <label htmlFor="txFee" className="block text-sm font-medium text-gray-700 mb-1.5">
            Current Transaction Fee (EUR)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">EUR</span>
            <input
              id="txFee"
              type="number"
              min={0}
              max={5}
              step={0.01}
              value={data.currentTxFee || ''}
              onChange={(e) => onChange({ currentTxFee: Number(e.target.value) })}
              placeholder="0.00"
              className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            Per-transaction fee charged by current processor
          </p>
        </div>

        {/* Monthly Fee */}
        <div>
          <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700 mb-1.5">
            Current Monthly Fee (EUR)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">EUR</span>
            <input
              id="monthlyFee"
              type="number"
              min={0}
              max={10000}
              step={1}
              value={data.currentMonthlyFee || ''}
              onChange={(e) => onChange({ currentMonthlyFee: Number(e.target.value) })}
              placeholder="0"
              className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            Monthly service/gateway fee per property
          </p>
        </div>
      </div>
    </div>
  );
}
