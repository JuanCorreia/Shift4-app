import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deals, escalations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { partnerFilter } from "@/lib/db/helpers";
import {
  FileText,
  Clock,
  ShieldCheck,
  Send,
  PlusCircle,
  AlertTriangle,
  Archive,
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
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

  // Partner scoping
  const pf = partnerFilter(session);

  // Fetch stats by status — count + volume per pipeline stage
  const statusStats = await db
    .select({
      status: deals.status,
      count: sql<number>`count(*)`,
      volume: sql<string>`coalesce(sum(annual_volume), 0)`,
    })
    .from(deals)
    .where(pf)
    .groupBy(deals.status);

  function getStatusStat(s: string) {
    const row = statusStats.find((r) => r.status === s);
    return { count: Number(row?.count ?? 0), volume: Number(row?.volume ?? 0) };
  }

  // Revenue metrics from pricing_result JSON
  const [revenueMetrics] = await db
    .select({
      totalSavings: sql<string>`coalesce(sum((pricing_result->>'annualSavings')::numeric), 0)`,
      totalDccRevenue: sql<string>`coalesce(sum((pricing_result->'dccRevenue'->>'annualRevenue')::numeric), 0)`,
      avgMargin: sql<string>`coalesce(avg((pricing_result->'marginEstimate'->>'margin')::numeric), 0)`,
      pipelineValue: sql<string>`coalesce(sum(annual_volume), 0)`,
    })
    .from(deals)
    .where(pf ? sql`${pf} AND status != 'archived'` : sql`status != 'archived'`);

  const draft = getStatusStat("draft");
  const review = getStatusStat("review");
  const approved = getStatusStat("approved");
  const sent = getStatusStat("sent");
  const archived = getStatusStat("archived");

  // Escalation alerts: count deals with unresolved escalations
  const dealsWithEscalations = await db
    .select({
      dealId: escalations.dealId,
      count: sql<number>`count(*)`,
    })
    .from(escalations)
    .where(eq(escalations.resolved, false))
    .groupBy(escalations.dealId);

  const totalCount = draft.count + review.count + approved.count + sent.count + archived.count;

  function fmtVol(v: number): string {
    if (v >= 1_000_000_000) return `\u20AC${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `\u20AC${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `\u20AC${(v / 1_000).toFixed(0)}K`;
    return `\u20AC${v}`;
  }

  const statCards = [
    {
      label: "Draft",
      value: String(draft.count),
      sub: fmtVol(draft.volume),
      icon: FileText,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
    {
      label: "In Review",
      value: String(review.count),
      sub: fmtVol(review.volume),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Approved",
      value: String(approved.count),
      sub: fmtVol(approved.volume),
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Sent",
      value: String(sent.count),
      sub: fmtVol(sent.volume),
      icon: Send,
      color: "text-blue-600",
      bg: "bg-blue-50",
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

      {/* Revenue boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Projected Savings",
            value: fmtVol(Number(revenueMetrics?.totalSavings ?? 0)),
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "DCC Revenue",
            value: fmtVol(Number(revenueMetrics?.totalDccRevenue ?? 0)),
            icon: DollarSign,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Avg Margin",
            value: `${Number(revenueMetrics?.avgMargin ?? 0).toFixed(1)} bps`,
            icon: Percent,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            label: "Pipeline Value",
            value: fmtVol(Number(revenueMetrics?.pipelineValue ?? 0)),
            icon: BarChart3,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
        ].map((card) => {
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
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {card.value}
                  </p>
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

      {/* Pipeline summary */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span><span className="font-semibold text-slate-700">{totalCount}</span> total deals</span>
        <span className="text-slate-300">|</span>
        <span className="inline-flex items-center gap-1">
          <Archive className="w-3.5 h-3.5" />
          {archived.count} archived ({fmtVol(archived.volume)})
        </span>
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
