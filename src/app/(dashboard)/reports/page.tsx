"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import PipelineTab from "@/components/reports/PipelineTab";
import RevenueTab from "@/components/reports/RevenueTab";
import ForecastTab from "@/components/reports/ForecastTab";

const TABS = [
  { key: "pipeline", label: "Pipeline" },
  { key: "revenue", label: "Revenue" },
  { key: "forecast", label: "Forecast" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ReportsPage() {
  const [tab, setTab] = useState<TabKey>("pipeline");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !data ? (
        <p className="text-slate-500">Failed to load report data.</p>
      ) : (
        <>
          {tab === "pipeline" && (
            <PipelineTab
              pipeline={data.pipeline as never[]}
              funnel={data.funnel as never[]}
            />
          )}
          {tab === "revenue" && (
            <RevenueTab revenueByTier={data.revenueByTier as never[]} />
          )}
          {tab === "forecast" && (
            <ForecastTab monthlyTrends={data.monthlyTrends as never[]} />
          )}
        </>
      )}
    </div>
  );
}
