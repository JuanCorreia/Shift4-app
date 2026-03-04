'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface EscalationRecord {
  id: string;
  code: string;
  severity: string;
  message: string;
  details: string | null;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface EscalationListProps {
  dealId: string;
  userId: string;
}

export default function EscalationList({ dealId, userId }: EscalationListProps) {
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEscalations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  async function fetchEscalations() {
    try {
      const res = await fetch(`/api/deals/${dealId}/escalations`);
      if (res.ok) {
        const data = await res.json();
        setEscalations(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(escalationId: string) {
    setResolvingId(escalationId);
    try {
      const res = await fetch(`/api/deals/${dealId}/escalations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationId, resolved: true }),
      });
      if (res.ok) {
        setEscalations((prev) =>
          prev.map((e) =>
            e.id === escalationId
              ? { ...e, resolved: true, resolvedBy: userId, resolvedAt: new Date().toISOString() }
              : e
          )
        );
      }
    } finally {
      setResolvingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading escalations...
      </div>
    );
  }

  if (escalations.length === 0) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No escalations</h3>
        <p className="text-sm text-gray-500">This deal has no pricing escalations.</p>
      </div>
    );
  }

  const unresolved = escalations.filter((e) => !e.resolved);
  const resolved = escalations.filter((e) => e.resolved);

  // Sort: criticals first, then warnings
  const sortBySeverity = (a: EscalationRecord, b: EscalationRecord) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return 0;
  };

  const sortedUnresolved = [...unresolved].sort(sortBySeverity);
  const sortedResolved = [...resolved].sort(sortBySeverity);

  return (
    <div className="space-y-6">
      {/* Unresolved count */}
      {unresolved.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <AlertCircle className="w-3.5 h-3.5" />
            {unresolved.length} unresolved
          </span>
        </div>
      )}

      {/* Unresolved escalations */}
      {sortedUnresolved.length > 0 && (
        <div className="space-y-3">
          {sortedUnresolved.map((esc) => (
            <EscalationItem
              key={esc.id}
              escalation={esc}
              expanded={expandedIds.has(esc.id)}
              onToggle={() => toggleExpand(esc.id)}
              onResolve={() => handleResolve(esc.id)}
              resolving={resolvingId === esc.id}
            />
          ))}
        </div>
      )}

      {/* Resolved escalations */}
      {sortedResolved.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Resolved ({sortedResolved.length})
          </h4>
          {sortedResolved.map((esc) => (
            <EscalationItem
              key={esc.id}
              escalation={esc}
              expanded={expandedIds.has(esc.id)}
              onToggle={() => toggleExpand(esc.id)}
              resolved
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
  onResolve,
  resolving,
  resolved,
}: {
  escalation: EscalationRecord;
  expanded: boolean;
  onToggle: () => void;
  onResolve?: () => void;
  resolving?: boolean;
  resolved?: boolean;
}) {
  const isCritical = escalation.severity === 'critical';
  const Icon = isCritical ? AlertCircle : AlertTriangle;

  const containerClass = resolved
    ? 'bg-gray-50 border-gray-200 opacity-60'
    : isCritical
      ? 'bg-red-50 border-red-200'
      : 'bg-amber-50 border-amber-200';

  const iconColor = resolved
    ? 'text-gray-400'
    : isCritical
      ? 'text-red-500'
      : 'text-amber-500';

  const textColor = resolved
    ? 'text-gray-500'
    : isCritical
      ? 'text-red-800'
      : 'text-amber-800';

  return (
    <div className={`rounded-lg border ${containerClass} overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {resolved ? (
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
        ) : (
          <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
              resolved ? 'bg-gray-200 text-gray-500' : isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {escalation.code}
            </span>
            <span className={`text-sm font-medium ${textColor}`}>
              {escalation.message}
            </span>
          </div>
          {resolved && escalation.resolvedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Resolved {new Date(escalation.resolvedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!resolved && onResolve && (
            <button
              onClick={onResolve}
              disabled={resolving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {resolving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Resolve
            </button>
          )}

          {escalation.details && (
            <button
              onClick={onToggle}
              className={`p-1 rounded ${resolved ? 'text-gray-400' : iconColor}`}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {expanded && escalation.details && (
        <div className={`px-4 pb-3 pl-12 text-xs ${textColor} opacity-80`}>
          {escalation.details}
        </div>
      )}
    </div>
  );
}
