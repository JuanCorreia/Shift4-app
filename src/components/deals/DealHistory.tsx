import { db } from '@/lib/db';
import { dealHistory, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  GitCommitHorizontal,
  FilePlus,
  ArrowRightLeft,
  PenLine,
  Clock,
} from 'lucide-react';

interface DealHistoryProps {
  dealId: string;
}

export default async function DealHistory({ dealId }: DealHistoryProps) {
  // Fetch history with user names via a join
  const historyRows = await db
    .select({
      id: dealHistory.id,
      action: dealHistory.action,
      field: dealHistory.field,
      oldValue: dealHistory.oldValue,
      newValue: dealHistory.newValue,
      createdAt: dealHistory.createdAt,
      userName: users.name,
    })
    .from(dealHistory)
    .leftJoin(users, eq(dealHistory.userId, users.id))
    .where(eq(dealHistory.dealId, dealId))
    .orderBy(desc(dealHistory.createdAt));

  if (historyRows.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No history yet</h3>
        <p className="text-sm text-gray-500">Actions on this deal will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gray-200" />

      <div className="space-y-0">
        {historyRows.map((entry, index) => {
          const isFirst = index === 0;
          const { icon: Icon, color, description } = getEntryDisplay(entry);

          return (
            <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Dot */}
              <div
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white flex-shrink-0 ${
                  isFirst ? `border-emerald-700 ${color}` : 'border-gray-200 text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1.5">
                <p className={`text-sm ${isFirst ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                  {description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {entry.userName && (
                    <span className="text-xs text-gray-500">{entry.userName}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(entry.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getEntryDisplay(entry: {
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
}) {
  if (entry.action === 'created') {
    return {
      icon: FilePlus,
      color: 'text-green-500',
      description: 'Deal created',
    };
  }

  if (entry.action === 'status_changed') {
    const oldLabel = formatStatus(entry.oldValue);
    const newLabel = formatStatus(entry.newValue);
    return {
      icon: ArrowRightLeft,
      color: 'text-emerald-700',
      description: `Status changed from ${oldLabel} to ${newLabel}`,
    };
  }

  if (entry.action === 'updated' && entry.field) {
    const fieldLabel = formatFieldName(entry.field);
    return {
      icon: PenLine,
      color: 'text-amber-500',
      description: `Changed ${fieldLabel} from "${entry.oldValue || '--'}" to "${entry.newValue || '--'}"`,
    };
  }

  return {
    icon: GitCommitHorizontal,
    color: 'text-gray-400',
    description: entry.action,
  };
}

function formatStatus(status: string | null): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    review: 'In Review',
    approved: 'Approved',
    sent: 'Sent',
    archived: 'Archived',
  };
  return map[status || ''] || status || 'Unknown';
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace('Card Mix ', 'Card Mix: ')
    .replace('Dcc', 'DCC')
    .trim();
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
