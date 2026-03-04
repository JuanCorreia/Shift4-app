import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deals, escalations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  FileText,
  Clock,
  DollarSign,
  TrendingDown,
  PlusCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { DealTable } from "@/components/deals/DealTable";
import DealFilters from "@/components/deals/DealFilters";

interface DashboardProps {
  searchParams: {
    status?: string;
    search?: string;
    page?: string;
    sort?: string;
    from?: string;
    to?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const status = searchParams.status || "all";
  const search = searchParams.search || "";
  const page = Number(searchParams.page) || 1;
  const sort = searchParams.sort || "newest";

  // Fetch stats from DB - counts by status
  const [totalDeals] = await db
    .select({ count: sql<number>`count(*)` })
    .from(deals);

  const [draftDeals] = await db
    .select({ count: sql<number>`count(*)` })
    .from(deals)
    .where(eq(deals.status, "draft"));

  const [reviewDeals] = await db
    .select({ count: sql<number>`count(*)` })
    .from(deals)
    .where(eq(deals.status, "review"));

  const [approvedDeals] = await db
    .select({ count: sql<number>`count(*)` })
    .from(deals)
    .where(eq(deals.status, "approved"));

  const [sentDeals] = await db
    .select({ count: sql<number>`count(*)` })
    .from(deals)
    .where(eq(deals.status, "sent"));

  const [archivedDeals] = await db
    .select({ count: sql<number>`count(*)` })
    .from(deals)
    .where(eq(deals.status, "archived"));

  const [volumeResult] = await db
    .select({ total: sql<string>`coalesce(sum(annual_volume), 0)` })
    .from(deals);

  const [savingsResult] = await db
    .select({
      avg: sql<string>`coalesce(avg((pricing_result->>'savingsPercent')::numeric), 0)`,
    })
    .from(deals)
    .where(sql`pricing_result is not null and pricing_result->>'savingsPercent' is not null`);

  // Escalation alerts: count deals with unresolved escalations
  const dealsWithEscalations = await db
    .select({
      dealId: escalations.dealId,
      count: sql<number>`count(*)`,
    })
    .from(escalations)
    .where(eq(escalations.resolved, false))
    .groupBy(escalations.dealId);

  const totalVolume = Number(volumeResult.total);
  const avgSavings = Number(savingsResult.avg);

  function formatVolume(v: number): string {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  }

  const statCards = [
    {
      label: "Total Deals",
      value: String(Number(totalDeals.count)),
      sub: `${Number(draftDeals.count)} draft`,
      icon: FileText,
      color: "text-emerald-800",
      bg: "bg-emerald-50",
    },
    {
      label: "In Review",
      value: String(Number(reviewDeals.count)),
      sub: `${Number(approvedDeals.count)} approved`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total Volume",
      value: `\u20AC${formatVolume(totalVolume)}`,
      sub: `${Number(sentDeals.count)} sent`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Avg Savings",
      value: `${avgSavings.toFixed(1)}%`,
      sub: `${Number(archivedDeals.count)} archived`,
      icon: TrendingDown,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {session.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s an overview of your deal pipeline.
          </p>
        </div>
        <Link
          href="/deals/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          New Deal
        </Link>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{card.sub}</p>
                </div>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${card.bg}`}
                >
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Escalation alerts */}
      {dealsWithEscalations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800">
                {dealsWithEscalations.length} deal{dealsWithEscalations.length !== 1 ? 's' : ''} with unresolved escalations
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {dealsWithEscalations.slice(0, 5).map((row) => (
                  <Link
                    key={row.dealId}
                    href={`/deals/${row.dealId}?tab=escalations`}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {Number(row.count)} issue{Number(row.count) !== 1 ? 's' : ''}
                  </Link>
                ))}
                {dealsWithEscalations.length > 5 && (
                  <span className="inline-flex items-center px-3 py-1 text-xs text-amber-600">
                    +{dealsWithEscalations.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <DealFilters />

      {/* Deal table */}
      <DealTable
        status={status}
        search={search}
        page={page}
        sort={sort}
        from={searchParams.from}
        to={searchParams.to}
      />
    </div>
  );
}
