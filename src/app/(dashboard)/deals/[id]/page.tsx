import { db } from "@/lib/db";
import { deals, escalations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { partnerFilter } from "@/lib/db/helpers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Star, CreditCard, TrendingUp, History, AlertTriangle, FileText, ExternalLink, GitCompare } from "lucide-react";
import PriceHistoryTab from "@/components/deals/PriceHistoryTab";
import { StatusBadge } from "@/components/deals/StatusBadge";
import { getSession } from "@/lib/auth/session";
import StatusWorkflow from "@/components/deals/StatusWorkflow";
import DealHistory from "@/components/deals/DealHistory";
import EscalationList from "@/components/deals/EscalationList";

interface DealDetailPageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

function formatCurrency(value: string | null) {
  if (!value) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatPercent(value: string | null) {
  if (!value) return "--";
  return `${Number(value).toFixed(2)}%`;
}

type TabKey = 'overview' | 'history' | 'price-history' | 'escalations' | 'proposal';

export default async function DealDetailPage({ params, searchParams }: DealDetailPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = params;
  const activeTab: TabKey = (searchParams.tab as TabKey) || 'overview';

  const pf = partnerFilter(session);
  const dealConditions = pf ? and(eq(deals.id, id), pf) : eq(deals.id, id);
  const [deal] = await db.select().from(deals).where(dealConditions);
  if (!deal) notFound();

  // Count unresolved escalations for badge
  const [escCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(escalations)
    .where(and(eq(escalations.dealId, id), eq(escalations.resolved, false)));
  const unresolvedCount = Number(escCount.count);

  const pricingResult = deal.pricingResult as Record<string, unknown> | null;
  const userRole = session.role as 'analyst' | 'admin' | 'viewer';

  const tabs: { key: TabKey; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'history', label: 'History', icon: History },
    { key: 'price-history', label: 'Price History', icon: GitCompare },
    { key: 'escalations', label: 'Escalations', icon: AlertTriangle, badge: unresolvedCount },
    { key: 'proposal', label: 'Proposal', icon: ExternalLink },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {deal.merchantName}
              </h1>
              <StatusBadge status={deal.status} />
            </div>
            {deal.hotelGroup && (
              <p className="text-gray-500 mt-1">{deal.hotelGroup}</p>
            )}
          </div>
          {/* Edit functionality not yet implemented — route /deals/[id]/edit does not exist */}
        </div>
      </div>

      {/* Status Workflow */}
      <StatusWorkflow
        dealId={id}
        currentStatus={deal.status as 'draft' | 'review' | 'approved' | 'sent' | 'archived'}
        userRole={userRole}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            // Proposal tab links to a different page
            if (tab.key === 'proposal') {
              return (
                <Link
                  key={tab.key}
                  href={`/deals/${id}/proposal`}
                  className="pb-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              );
            }

            return (
              <Link
                key={tab.key}
                href={`/deals/${id}?tab=${tab.key}`}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                  isActive
                    ? "border-emerald-800 text-emerald-800"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Merchant info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Merchant Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Properties</p>
                    <p className="text-sm font-medium text-gray-900">
                      {deal.propertyCount || 1}
                    </p>
                  </div>
                </div>
                {deal.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">
                        {deal.location}
                      </p>
                    </div>
                  </div>
                )}
                {deal.starRating && (
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Star Rating</p>
                      <p className="text-sm font-medium text-gray-900">
                        {"\u2605".repeat(deal.starRating)}
                        {"\u2606".repeat(5 - deal.starRating)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Current Processor</p>
                    <p className="text-sm font-medium text-gray-900">
                      {deal.currentProcessor || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Volume & pricing */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Volume & Pricing
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Annual Volume</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(deal.annualVolume)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Transaction Size</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(deal.avgTransactionSize)}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Card Mix</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Visa:</span>{" "}
                      <span className="font-medium">{formatPercent(deal.cardMixVisa)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">MC:</span>{" "}
                      <span className="font-medium">{formatPercent(deal.cardMixMastercard)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Amex:</span>{" "}
                      <span className="font-medium">{formatPercent(deal.cardMixAmex)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">MBWay:</span>{" "}
                      <span className="font-medium">{formatPercent(deal.cardMixMbway)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Other:</span>{" "}
                      <span className="font-medium">{formatPercent(deal.cardMixOther)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing results */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Pricing Results
              </h3>
              {pricingResult ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Annual Savings</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(String(pricingResult.annualSavings ?? 0))}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Number(pricingResult.savingsPercent ?? 0).toFixed(1)}% reduction
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tier</p>
                    <p className="text-sm font-medium text-gray-900">
                      {String(pricingResult.tierName ?? "N/A")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Proposed Rate</p>
                    <p className="text-sm font-medium text-gray-900">
                      {Number(pricingResult.adjustedRate ?? 0).toFixed(0)} bps
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-8">
                  <p>No pricing calculated yet.</p>
                  <p className="mt-1">Complete the wizard to generate results.</p>
                </div>
              )}
            </div>
          </div>

          {/* Acquiring Revenue Breakdown */}
          {pricingResult && (() => {
            const annualVol = Number(deal.annualVolume);
            const avgTxSize = Number(deal.avgTransactionSize);
            const dcc = pricingResult.dccRevenue as Record<string, unknown> | null;

            // Acquiring revenue
            const currentRate = deal.currentBlendedRate ? Number(deal.currentBlendedRate) : 0;
            const adjustedRate = Number(pricingResult.adjustedRate ?? 0);
            const baseRate = Number(pricingResult.baseRate ?? 0);
            const eligibleVolume = annualVol;
            const currentAcquirerRevenue = (eligibleVolume * currentRate) / 10000;
            const ourRevenueRateA = (eligibleVolume * adjustedRate) / 10000;
            const ourRevenueRateB = (eligibleVolume * baseRate) / 10000;

            // Transaction fee revenue
            const estTxCount = avgTxSize > 0 ? Math.round(annualVol / avgTxSize) : 0;
            const currentTxFee = deal.currentTxFee ? Number(deal.currentTxFee) : 0;
            const currentTxRevenue = estTxCount * currentTxFee;
            const ourTxFee = Number(pricingResult.proposedTxFee ?? 0);
            const ourTxRevenue = estTxCount * ourTxFee;
            const ourTxCost = estTxCount * 0.01;
            const ourTxNet = ourTxRevenue - ourTxCost;

            // DCC revenue
            const dccAnnualRevenue = dcc ? Number(dcc.annualRevenue ?? 0) : 0;
            const dccShareHost = dcc ? Number(dcc.revenueShareHost ?? 0) : 0;

            // Totals (Rate A)
            const totalCurrentRevenue = currentAcquirerRevenue + currentTxRevenue;
            const totalOurRevenueA = ourRevenueRateA + ourTxNet + dccShareHost;

            return (
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Acquiring Revenue Breakdown
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Box 1: Acquiring Revenue */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-3">
                      Acquiring Revenue
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Eligible Volume</span>
                        <span className="font-medium">{formatCurrency(String(eligibleVolume))}</span>
                      </div>
                      <div className="border-t border-gray-100 pt-2">
                        <p className="text-xs text-gray-400 mb-1">Current Acquirer</p>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Revenue at {currentRate} bps</span>
                          <span className="font-medium">{formatCurrency(String(Math.round(currentAcquirerRevenue)))}</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-2">
                        <p className="text-xs text-gray-400 mb-1">Our Revenue</p>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Rate A ({adjustedRate.toFixed(0)} bps)</span>
                          <span className="font-semibold text-emerald-700">{formatCurrency(String(Math.round(ourRevenueRateA)))}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-500">Rate B ({baseRate.toFixed(0)} bps)</span>
                          <span className="font-medium text-gray-700">{formatCurrency(String(Math.round(ourRevenueRateB)))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Box 2: Transaction Fee Revenue */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wider mb-3">
                      Transaction Fee Revenue
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Est. Transaction Count</span>
                        <span className="font-medium">{estTxCount.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-gray-100 pt-2">
                        <p className="text-xs text-gray-400 mb-1">Current Acquirer</p>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fee: &euro;{currentTxFee.toFixed(4)}</span>
                          <span className="font-medium">{formatCurrency(String(Math.round(currentTxRevenue)))}</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-2">
                        <p className="text-xs text-gray-400 mb-1">Our Suggested</p>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fee: &euro;{ourTxFee.toFixed(2)}</span>
                          <span className="font-medium">{formatCurrency(String(Math.round(ourTxRevenue)))}</span>
                        </div>
                        <div className="flex justify-between mt-1 text-xs">
                          <span className="text-gray-400">Our cost: &euro;0.01/tx</span>
                          <span className="text-gray-400">Net: {formatCurrency(String(Math.round(ourTxNet)))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Box 3: DCC Revenue (or placeholder) */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">
                      DCC Revenue
                    </h4>
                    {dcc && dccAnnualRevenue > 0 ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Eligible Intl Volume</span>
                          <span className="font-medium">{formatCurrency(String(Math.round(Number(dcc.eligibleVolume ?? 0))))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Projected Uptake</span>
                          <span className="font-medium">{formatCurrency(String(Math.round(Number(dcc.projectedUptake ?? 0))))}</span>
                        </div>
                        <div className="border-t border-gray-100 pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Annual DCC Revenue</span>
                            <span className="font-semibold text-amber-700">{formatCurrency(String(Math.round(dccAnnualRevenue)))}</span>
                          </div>
                          <div className="flex justify-between mt-1 text-xs">
                            <span className="text-gray-400">Merchant share</span>
                            <span className="text-gray-400">{formatCurrency(String(Math.round(Number(dcc.revenueShareMerchant ?? 0))))}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Our share</span>
                            <span className="text-gray-400">{formatCurrency(String(Math.round(dccShareHost)))}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-6">
                        <p>Not DCC eligible</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary box */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <h4 className="text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-3">
                    Revenue Summary
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-emerald-700">Acquiring Revenue (Rate A)</p>
                      <p className="text-lg font-bold text-emerald-900">{formatCurrency(String(Math.round(ourRevenueRateA)))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700">Transaction Fee Net</p>
                      <p className="text-lg font-bold text-emerald-900">{formatCurrency(String(Math.round(ourTxNet)))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700">DCC Share</p>
                      <p className="text-lg font-bold text-emerald-900">{formatCurrency(String(Math.round(dccShareHost)))}</p>
                    </div>
                    <div className="border-l-2 border-emerald-300 pl-4">
                      <p className="text-xs text-emerald-700 font-semibold">Total Revenue</p>
                      <p className="text-xl font-bold text-emerald-900">{formatCurrency(String(Math.round(totalOurRevenueA)))}</p>
                      {totalCurrentRevenue > 0 && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          vs current: {formatCurrency(String(Math.round(totalCurrentRevenue)))}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Narrative */}
          {deal.narrative && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                AI Narrative
              </h3>
              <div className="prose prose-sm max-w-none text-gray-700">
                {deal.narrative}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <DealHistory dealId={id} />
        </div>
      )}

      {activeTab === 'price-history' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <PriceHistoryTab dealId={id} />
        </div>
      )}

      {activeTab === 'escalations' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <EscalationList dealId={id} userId={session.userId} />
        </div>
      )}

      {/* Mode info */}
      <div className="mt-6 text-xs text-gray-400">
        Created via {deal.mode === "statement" ? "Statement Upload" : "Guided Wizard"} on{" "}
        {deal.createdAt.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>
    </div>
  );
}
