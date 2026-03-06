"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface MonthlyData {
  month: string;
  count: number;
  volume: string;
}

function fmtEur(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
  return `€${v.toFixed(0)}`;
}

export default function ForecastTab({
  monthlyTrends,
}: {
  monthlyTrends: MonthlyData[];
}) {
  const chartData = monthlyTrends.map((m) => ({
    month: m.month,
    deals: m.count,
    volume: Number(m.volume),
  }));

  return (
    <div className="space-y-8">
      {/* Monthly Volume Trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Monthly Volume Trends
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => fmtEur(v)}
              />
              <Tooltip
                formatter={(value) => [fmtEur(Number(value ?? 0)), "Volume"]}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#395542"
                strokeWidth={2}
                dot={{ fill: "#395542", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Deal Count */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Deals Created per Month
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="deals"
                fill="#CF987E"
                radius={[4, 4, 0, 0]}
                name="Deals"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
