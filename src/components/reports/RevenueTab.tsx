"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TierData {
  tier: string | null;
  count: number;
  volume: string;
  savings: string;
  dccRevenue: string;
  avgMargin: string;
}

function fmtEur(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
  return `€${v.toFixed(0)}`;
}

export default function RevenueTab({
  revenueByTier,
}: {
  revenueByTier: TierData[];
}) {
  const chartData = revenueByTier
    .filter((t) => t.tier)
    .map((t) => ({
      tier: t.tier,
      savings: Number(t.savings),
      dccRevenue: Number(t.dccRevenue),
      margin: Number(t.avgMargin),
    }));

  return (
    <div className="space-y-8">
      {/* DCC Revenue by Tier */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Revenue by Tier
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="tier" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [
                  name === "margin" ? `${Number(value ?? 0).toFixed(1)} bps` : fmtEur(Number(value ?? 0)),
                  name === "savings"
                    ? "Savings"
                    : name === "dccRevenue"
                    ? "DCC Revenue"
                    : "Margin",
                ]}
              />
              <Bar
                dataKey="savings"
                fill="#395542"
                radius={[4, 4, 0, 0]}
                name="Savings"
              />
              <Bar
                dataKey="dccRevenue"
                fill="#CF987E"
                radius={[4, 4, 0, 0]}
                name="DCC Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Margin Analysis Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Margin Analysis by Tier
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-500">
                  Tier
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">
                  Deals
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">
                  Volume
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">
                  Savings
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">
                  DCC Revenue
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">
                  Avg Margin
                </th>
              </tr>
            </thead>
            <tbody>
              {revenueByTier
                .filter((t) => t.tier)
                .map((t) => (
                  <tr
                    key={t.tier}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {t.tier}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {t.count}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {fmtEur(Number(t.volume))}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      {fmtEur(Number(t.savings))}
                    </td>
                    <td className="py-3 px-4 text-right text-violet-600 font-medium">
                      {fmtEur(Number(t.dccRevenue))}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {Number(t.avgMargin).toFixed(1)} bps
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
