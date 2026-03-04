'use client';

import { useState } from 'react';
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Escalation } from '@/lib/pricing';

interface EscalationPanelProps {
  escalations: Escalation[];
}

export default function EscalationPanel({ escalations }: EscalationPanelProps) {
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  if (escalations.length === 0) return null;

  const criticals = escalations.filter((e) => e.severity === 'critical');
  const warnings = escalations.filter((e) => e.severity === 'warning');

  function toggleExpand(code: string) {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Escalations ({escalations.length})
      </h3>

      {criticals.length > 0 && (
        <div className="space-y-2">
          {criticals.map((esc) => (
            <EscalationItem
              key={esc.code}
              escalation={esc}
              expanded={expandedCodes.has(esc.code)}
              onToggle={() => toggleExpand(esc.code)}
            />
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((esc) => (
            <EscalationItem
              key={esc.code}
              escalation={esc}
              expanded={expandedCodes.has(esc.code)}
              onToggle={() => toggleExpand(esc.code)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EscalationItem({
  escalation,
  expanded,
  onToggle,
}: {
  escalation: Escalation;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isCritical = escalation.severity === 'critical';
  const bg = isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
  const iconColor = isCritical ? 'text-red-500' : 'text-amber-500';
  const textColor = isCritical ? 'text-red-800' : 'text-amber-800';
  const Icon = isCritical ? AlertCircle : AlertTriangle;

  return (
    <div className={`rounded-lg border ${bg} overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
        <span className={`flex-1 text-sm font-medium ${textColor}`}>
          {escalation.message}
        </span>
        {escalation.details && (
          expanded
            ? <ChevronUp className={`w-4 h-4 ${iconColor}`} />
            : <ChevronDown className={`w-4 h-4 ${iconColor}`} />
        )}
      </button>

      {expanded && escalation.details && (
        <div className={`px-4 pb-3 pl-12 text-xs ${textColor} opacity-80`}>
          {escalation.details}
        </div>
      )}
    </div>
  );
}
