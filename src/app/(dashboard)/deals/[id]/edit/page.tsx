import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { partnerFilter } from '@/lib/db/helpers';
import { getSession } from '@/lib/auth/session';
import { canEditDeals } from '@/lib/auth/permissions';
import WizardShell from '@/components/wizard/WizardShell';
import type { WizardFormData } from '@/components/wizard/WizardShell';

interface EditDealPageProps {
  params: { id: string };
}

export default async function EditDealPage({ params }: EditDealPageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = params;

  // Read-only users cannot edit; archived deals are frozen
  if (!canEditDeals(session)) redirect(`/deals/${id}`);

  const pf = partnerFilter(session);
  const conditions = pf ? and(eq(deals.id, id), pf) : eq(deals.id, id);
  const [deal] = await db.select().from(deals).where(conditions);
  if (!deal) notFound();
  if (deal.status === 'archived') redirect(`/deals/${id}`);

  const initialData: WizardFormData = {
    merchantName: deal.merchantName,
    hotelGroup: deal.hotelGroup ?? '',
    starRating: deal.starRating ?? 4,
    propertyCount: deal.propertyCount ?? 1,
    location: deal.location ?? '',
    annualVolume: Number(deal.annualVolume),
    avgTransactionSize: Number(deal.avgTransactionSize),
    cardMix: {
      visa: Number(deal.cardMixVisa ?? 40),
      mastercard: Number(deal.cardMixMastercard ?? 35),
      amex: Number(deal.cardMixAmex ?? 15),
      mbway: Number(deal.cardMixMbway ?? 0),
      other: Number(deal.cardMixOther ?? 10),
      international: Number(deal.cardMixInternational ?? 25),
      corporate: Number(deal.cardMixCorporate ?? 15),
      debit: Number(deal.cardMixDebit ?? 30),
    },
    currentProcessor: deal.currentProcessor ?? '',
    currentBlendedRate: Number(deal.currentBlendedRate ?? 0),
    currentTxFee: Number(deal.currentTxFee ?? 0),
    currentMonthlyFee: Number(deal.currentMonthlyFee ?? 0),
    dccEligible: Boolean(deal.dccEligible),
    dccUptake: Number(deal.dccUptake ?? 0),
    dccMarkup: Number(deal.dccMarkup ?? 3.5),
    merchantDccShare: Number(deal.merchantDccShare ?? 1.0),
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/deals/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deal
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 break-words">Edit Deal — {deal.merchantName}</h1>
        <p className="text-gray-500 mt-1">
          Update merchant details; pricing is recalculated and a snapshot is saved on change
        </p>
      </div>

      <WizardShell dealId={id} initialData={initialData} />
    </div>
  );
}
