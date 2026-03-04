'use client';

import { useState, useCallback } from 'react';
import { FileText, FileDown, RefreshCw, Loader2, ArrowLeft } from 'lucide-react';
import type { PricingResult } from '@/lib/pricing/types';
import Link from 'next/link';

interface DealData {
  id: string;
  merchantName: string;
  hotelGroup?: string | null;
  starRating?: number | null;
  propertyCount?: number | null;
  location?: string | null;
  annualVolume: string;
  avgTransactionSize: string;
  currentProcessor?: string | null;
  currentBlendedRate?: string | null;
  currentTxFee?: string | null;
  currentMonthlyFee?: string | null;
  dccEligible?: boolean | null;
  narrative?: string | null;
  pricingResult: PricingResult;
}

interface ProposalPreviewProps {
  deal: DealData;
}

function formatEur(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export default function ProposalPreview({ deal }: ProposalPreviewProps) {
  const [narrative, setNarrative] = useState(deal.narrative || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricing = deal.pricingResult;
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate narrative');
      }
      const data = await res.json();
      setNarrative(data.narrative);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [deal.id]);

  const handleExport = useCallback(async (format: 'pdf' | 'docx') => {
    const setLoading = format === 'pdf' ? setIsExportingPdf : setIsExportingDocx;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/export/${format}?dealId=${deal.id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to export ${format.toUpperCase()}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Shift4_Proposal_${deal.merchantName.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Export failed`);
    } finally {
      setLoading(false);
    }
  }, [deal.id, deal.merchantName]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/deals/${deal.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deal
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#395542] rounded-lg hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {narrative ? 'Regenerate Narrative' : 'Generate Narrative'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExportingPdf || !narrative}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#395542] bg-white border border-[#395542] rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Download PDF
          </button>
          <button
            onClick={() => handleExport('docx')}
            disabled={isExportingDocx || !narrative}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#395542] bg-white border border-[#395542] rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isExportingDocx ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Download DOCX
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Proposal preview (web layout) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Cover section */}
        <div className="bg-[#395542] text-white px-10 py-16 text-center">
          <p className="text-4xl font-bold tracking-wider mb-1">SHIFT4</p>
          <p className="text-sm text-gray-300 mb-10">Payment Technology Solutions</p>
          <div className="w-16 h-0.5 bg-[#CF987E] mx-auto mb-10" />
          <h1 className="text-3xl font-bold mb-3">Commercial Proposal</h1>
          <p className="text-xl text-gray-200">{deal.merchantName}</p>
          {deal.hotelGroup && (
            <p className="text-sm text-gray-300 mt-1">{deal.hotelGroup}</p>
          )}
          <p className="text-sm text-gray-400 mt-6">Prepared: {date}</p>
        </div>

        <div className="px-10 py-8 space-y-10">
          {/* Executive Summary */}
          <section>
            <h2 className="text-lg font-bold text-[#395542] border-b-2 border-[#CF987E] pb-2 mb-4">
              Executive Summary
            </h2>
            {narrative ? (
              <div className="space-y-2">
                <textarea
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  rows={8}
                  className="w-full text-sm text-gray-700 leading-relaxed border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#395542]/20 focus:border-[#395542] resize-y"
                />
                <p className="text-xs text-gray-400">Edit the narrative above before exporting.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No narrative generated yet.</p>
                <p className="text-xs mt-1">Click &quot;Generate Narrative&quot; to create the executive summary.</p>
              </div>
            )}
          </section>

          {/* Savings highlight */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Projected Annual Savings</p>
            <p className="text-3xl font-bold text-emerald-600">
              {formatEur(pricing.annualSavings)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {pricing.savingsPercent.toFixed(1)}% reduction in processing costs
            </p>
          </div>

          {/* Current vs Proposed */}
          <section>
            <h2 className="text-lg font-bold text-[#395542] border-b-2 border-[#CF987E] pb-2 mb-4">
              Current vs Proposed Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#395542] text-white">
                    <th className="text-left px-4 py-2.5 font-medium">Metric</th>
                    <th className="text-left px-4 py-2.5 font-medium">Current</th>
                    <th className="text-left px-4 py-2.5 font-medium">Proposed</th>
                    <th className="text-left px-4 py-2.5 font-medium">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 font-medium">Blended Rate</td>
                    <td className="px-4 py-2.5">{deal.currentBlendedRate ? `${Number(deal.currentBlendedRate)} bps` : '--'}</td>
                    <td className="px-4 py-2.5">{pricing.adjustedRate} bps</td>
                    <td className="px-4 py-2.5">
                      {deal.currentBlendedRate ? `${(Number(deal.currentBlendedRate) - pricing.adjustedRate).toFixed(0)} bps` : '--'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">Transaction Fee</td>
                    <td className="px-4 py-2.5">{deal.currentTxFee ? `EUR ${Number(deal.currentTxFee)}` : '--'}</td>
                    <td className="px-4 py-2.5">EUR {pricing.proposedTxFee}</td>
                    <td className="px-4 py-2.5">
                      {deal.currentTxFee ? `EUR ${(Number(deal.currentTxFee) - pricing.proposedTxFee).toFixed(4)}` : '--'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 font-medium">Monthly Fee</td>
                    <td className="px-4 py-2.5">{deal.currentMonthlyFee ? `EUR ${Number(deal.currentMonthlyFee)}` : '--'}</td>
                    <td className="px-4 py-2.5">EUR {pricing.proposedMonthlyFee}</td>
                    <td className="px-4 py-2.5">
                      {deal.currentMonthlyFee ? `EUR ${(Number(deal.currentMonthlyFee) - pricing.proposedMonthlyFee).toFixed(0)}` : '--'}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2.5 font-bold">Annual Cost</td>
                    <td className="px-4 py-2.5">{formatEur(pricing.annualCostCurrent)}</td>
                    <td className="px-4 py-2.5">{formatEur(pricing.annualCostProposed)}</td>
                    <td className="px-4 py-2.5 font-bold text-emerald-600">{formatEur(pricing.annualSavings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Pricing breakdown */}
          <section>
            <h2 className="text-lg font-bold text-[#395542] border-b-2 border-[#CF987E] pb-2 mb-4">
              Pricing Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#395542] text-white">
                    <th className="text-left px-4 py-2.5 font-medium">Component</th>
                    <th className="text-left px-4 py-2.5 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Pricing Tier', `${pricing.tierName} (Tier ${pricing.tier})`],
                    ['Base Rate', `${pricing.baseRate} bps`],
                    ['Adjusted Rate', `${pricing.adjustedRate} bps`],
                    ['Transaction Fee', `EUR ${pricing.proposedTxFee}`],
                    ['Monthly Fee', `EUR ${pricing.proposedMonthlyFee}`],
                    ['Annual Volume', formatEur(Number(deal.annualVolume))],
                  ].map(([label, value], i) => (
                    <tr key={label} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                      <td className="px-4 py-2.5 font-medium">{label}</td>
                      <td className="px-4 py-2.5">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* DCC Revenue */}
          {pricing.dccRevenue && (
            <section>
              <h2 className="text-lg font-bold text-[#395542] border-b-2 border-[#CF987E] pb-2 mb-4">
                DCC Revenue Projection
              </h2>
              <div className="bg-[#CF987E]/10 border border-[#CF987E]/30 rounded-lg p-6">
                <h3 className="text-base font-bold text-[#CF987E] mb-4">Dynamic Currency Conversion</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Eligible International Volume</p>
                    <p className="font-semibold">{formatEur(pricing.dccRevenue.eligibleVolume)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Projected Uptake</p>
                    <p className="font-semibold">{(pricing.dccRevenue.projectedUptake * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Annual DCC Revenue</p>
                    <p className="font-semibold">{formatEur(pricing.dccRevenue.annualRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Merchant Revenue Share</p>
                    <p className="font-semibold text-emerald-600">{formatEur(pricing.dccRevenue.revenueShareMerchant)}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Terms */}
          <section>
            <h2 className="text-lg font-bold text-[#395542] border-b-2 border-[#CF987E] pb-2 mb-4">
              Terms & Conditions
            </h2>
            <ol className="list-decimal list-inside text-xs text-gray-500 space-y-1.5">
              <li>This proposal is valid for 30 days from the date of issue.</li>
              <li>Rates are based on the volume and card mix data provided. Actual rates may vary upon final underwriting review.</li>
              <li>DCC revenue projections are estimates based on industry averages and are not guaranteed.</li>
              <li>All fees are exclusive of applicable taxes and regulatory charges.</li>
              <li>Contract terms and settlement schedules to be defined in the final merchant agreement.</li>
              <li>Shift4 reserves the right to adjust pricing based on risk assessment and compliance review.</li>
            </ol>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-10 py-4 flex justify-between text-xs text-gray-400">
          <span>Shift4 -- Confidential</span>
          <span>{date}</span>
        </div>
      </div>
    </div>
  );
}
