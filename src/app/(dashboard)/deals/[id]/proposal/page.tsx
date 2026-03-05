import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calculator } from 'lucide-react';
import ProposalPreview from '@/components/proposal/ProposalPreview';
import type { PricingResult } from '@/lib/pricing/types';
import { getSession } from '@/lib/auth/session';

interface ProposalPageProps {
  params: { id: string };
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = params;

  const [deal] = await db.select().from(deals).where(eq(deals.id, id));

  if (!deal) notFound();

  const pricingResult = deal.pricingResult as unknown as PricingResult | null;

  // No pricing results — prompt user to run pricing first
  if (!pricingResult) {
    return (
      <div>
        <Link
          href={`/deals/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deal
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Pricing Required
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Run the pricing engine first to generate pricing results. The proposal
            narrative and export features require completed pricing data.
          </p>
          <Link
            href={`/deals/${id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#395542] text-white text-sm font-medium rounded-lg hover:bg-[#162d4a] transition-colors"
          >
            Go to Deal Overview
          </Link>
        </div>
      </div>
    );
  }

  // Serialize deal data for the client component
  const dealData = {
    id: deal.id,
    merchantName: deal.merchantName,
    hotelGroup: deal.hotelGroup,
    starRating: deal.starRating,
    propertyCount: deal.propertyCount,
    location: deal.location,
    annualVolume: deal.annualVolume,
    avgTransactionSize: deal.avgTransactionSize,
    currentProcessor: deal.currentProcessor,
    currentBlendedRate: deal.currentBlendedRate,
    currentTxFee: deal.currentTxFee,
    currentMonthlyFee: deal.currentMonthlyFee,
    dccEligible: deal.dccEligible,
    narrative: deal.narrative,
    pricingResult,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Proposal: {deal.merchantName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, edit, and export the commercial proposal
        </p>
      </div>
      <ProposalPreview deal={dealData} />
    </div>
  );
}
