"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface PipelineData {
  status: string;
  count: number;
  volume: string;
}

interface FunnelData {
  status: string;
  count: number;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  sent: "Sent",
  archived: "Archived",
};

const COLORS = ["#395542", "#CF987E", "#3b82f6", "#8b5cf6", "#94a3b8"];

export default function PipelineTab({
  pipeline,
  funnel,
}: {
  pipeline: PipelineData[];
  funnel: FunnelData[];
}) {
  const barData = pipeline.map((p) => ({
    name: STATUS_LABELS[p.status] || p.status,
    deals: p.count,
    volume: Number(p.volume),
  }));

  const pieData = pipeline
    .filter((p) => p.status !== "archived")
    .map((p) => ({
      name: STATUS_LABELS[p.status] || p.status,
      value: Number(p.volume),
    }));

  const funnelData = funnel.map((f) => ({
    name: STATUS_LABELS[f.status] || f.status,
    count: f.count,
  }));

  return (
    <div className="space-y-8">
      {/* Deals by Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Deals by Status
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="deals" fill="#395542" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume by Status (pie) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Volume Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `€${(Number(value ?? 0) / 1_000_000).toFixed(1)}M`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Conversion Funnel
          </h3>
          <div className="space-y-3">
            {funnelData.map((step, idx) => {
              const maxCount = Math.max(...funnelData.map((f) => f.count), 1);
              const width = (step.count / maxCount) * 100;
              return (
                <div key={step.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{step.name}</span>
                    <span className="font-semibold text-slate-900">
                      {step.count}
                    </span>
                  </div>
                  <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{
                        width: `${width}%`,
                        backgroundColor: COLORS[idx % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
