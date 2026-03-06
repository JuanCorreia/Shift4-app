"use client";

import { useState, useEffect } from "react";
import { Clock, ArrowRight } from "lucide-react";

interface Snapshot {
  id: string;
  snapshotAt: string;
  triggerAction: string;
  pricingResult: Record<string, unknown>;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCurrency(v: unknown) {
  const n = Number(v ?? 0);
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toFixed(0)}`;
}

function DiffValue({ label, old, current, suffix }: { label: string; old: unknown; current: unknown; suffix?: string }) {
  const oldNum = Number(old ?? 0);
  const curNum = Number(current ?? 0);
  const diff = curNum - oldNum;
  const diffColor = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-slate-400";

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">{oldNum.toFixed(suffix === "bps" ? 0 : 0)}{suffix && ` ${suffix}`}</span>
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <span className="font-medium text-slate-900">{curNum.toFixed(suffix === "bps" ? 0 : 0)}{suffix && ` ${suffix}`}</span>
        {diff !== 0 && (
          <span className={`text-xs font-medium ${diffColor}`}>
            {diff > 0 ? "+" : ""}{diff.toFixed(suffix === "bps" ? 0 : 0)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PriceHistoryTab({ dealId }: { dealId: string }) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIdx, setCompareIdx] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch(`/api/deals/${dealId}/snapshots`)
      .then((r) => r.json())
      .then((d) => {
        setSnapshots(d.snapshots || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dealId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-12">
        No pricing snapshots yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="space-y-3">
        {snapshots.map((snap, idx) => {
          const pr = snap.pricingResult;
          const isSelected =
            compareIdx && (compareIdx[0] === idx || compareIdx[1] === idx);

          return (
            <button
              key={snap.id}
              onClick={() => {
                if (!compareIdx) {
                  setCompareIdx([idx, Math.min(idx + 1, snapshots.length - 1)]);
                } else if (compareIdx[0] === idx) {
                  setCompareIdx(null);
                } else {
                  setCompareIdx([compareIdx[0], idx]);
                }
              }}
              className={`w-full text-left flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                isSelected
                  ? "border-primary bg-emerald-50/50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {fmtDate(snap.snapshotAt)}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {snap.triggerAction}
                  </span>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-slate-500">
                  <span>Rate: {Number(pr.adjustedRate ?? 0).toFixed(0)} bps</span>
                  <span>Savings: {fmtCurrency(pr.annualSavings)}</span>
                  <span>Tier: {String(pr.tierName ?? "N/A")}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Side-by-side comparison */}
      {compareIdx && snapshots[compareIdx[0]] && snapshots[compareIdx[1]] && compareIdx[0] !== compareIdx[1] && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">
            Comparison
          </h4>
          <div className="space-y-1 divide-y divide-slate-50">
            <DiffValue
              label="Adjusted Rate"
              old={snapshots[compareIdx[1]].pricingResult.adjustedRate}
              current={snapshots[compareIdx[0]].pricingResult.adjustedRate}
              suffix="bps"
            />
            <DiffValue
              label="Annual Savings"
              old={snapshots[compareIdx[1]].pricingResult.annualSavings}
              current={snapshots[compareIdx[0]].pricingResult.annualSavings}
            />
            <DiffValue
              label="Annual Cost (Proposed)"
              old={snapshots[compareIdx[1]].pricingResult.annualCostProposed}
              current={snapshots[compareIdx[0]].pricingResult.annualCostProposed}
            />
            <DiffValue
              label="Savings %"
              old={snapshots[compareIdx[1]].pricingResult.savingsPercent}
              current={snapshots[compareIdx[0]].pricingResult.savingsPercent}
              suffix="%"
            />
          </div>
        </div>
      )}
    </div>
  );
}
