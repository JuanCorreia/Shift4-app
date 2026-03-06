'use client';

import { useState, useTransition } from 'react';
import { Check, ChevronRight, AlertTriangle, Archive, Send, ShieldCheck, Eye, Loader2, Trash2 } from 'lucide-react';
import { updateDealStatus, permanentlyDeleteDeal } from '@/app/(dashboard)/deals/actions';
import { useRouter } from 'next/navigation';

type DealStatus = 'draft' | 'review' | 'approved' | 'sent' | 'archived';
type UserRole = 'analyst' | 'admin' | 'viewer';

interface StatusWorkflowProps {
  dealId: string;
  currentStatus: DealStatus;
  userRole: UserRole;
}

const STEPS: { key: DealStatus; label: string; icon: React.ElementType }[] = [
  { key: 'draft', label: 'Draft', icon: Eye },
  { key: 'review', label: 'In Review', icon: AlertTriangle },
  { key: 'approved', label: 'Approved', icon: ShieldCheck },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'archived', label: 'Archived', icon: Archive },
];

const STATUS_ORDER: DealStatus[] = ['draft', 'review', 'approved', 'sent', 'archived'];

// Transition rules: { from -> allowed targets with required minimum role }
const TRANSITIONS: Record<DealStatus, { target: DealStatus; minRole: UserRole }[]> = {
  draft: [{ target: 'review', minRole: 'analyst' }],
  review: [{ target: 'approved', minRole: 'admin' }],
  approved: [{ target: 'sent', minRole: 'admin' }],
  sent: [],
  archived: [],
};

// Admin can archive from any status
function canArchive(role: UserRole): boolean {
  return role === 'admin';
}

function roleHasPermission(userRole: UserRole, minRole: UserRole): boolean {
  const roleWeight: Record<UserRole, number> = { viewer: 0, analyst: 1, admin: 2 };
  return roleWeight[userRole] >= roleWeight[minRole];
}

function getAvailableActions(currentStatus: DealStatus, userRole: UserRole) {
  const actions: { target: DealStatus; label: string }[] = [];

  const transitions = TRANSITIONS[currentStatus] || [];
  for (const t of transitions) {
    if (roleHasPermission(userRole, t.minRole)) {
      const step = STEPS.find((s) => s.key === t.target);
      actions.push({ target: t.target, label: `Move to ${step?.label || t.target}` });
    }
  }

  if (currentStatus !== 'archived' && canArchive(userRole)) {
    actions.push({ target: 'archived', label: 'Archive Deal' });
  }

  return actions;
}

export default function StatusWorkflow({ dealId, currentStatus, userRole }: StatusWorkflowProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] = useState<DealStatus | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const actions = getAvailableActions(currentStatus, userRole);

  function handleConfirm() {
    if (!confirmTarget) return;
    startTransition(async () => {
      await updateDealStatus(dealId, confirmTarget);
      setConfirmTarget(null);
    });
  }

  function handlePermanentDelete() {
    startTransition(async () => {
      await permanentlyDeleteDeal(dealId);
      router.push('/');
    });
  }

  // For the stepper, show the main flow (excluding archived unless current)
  const mainFlow = currentStatus === 'archived' ? STEPS : STEPS.filter((s) => s.key !== 'archived');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-6">
        {mainFlow.map((step, i) => {
          const stepIdx = STATUS_ORDER.indexOf(step.key);
          const isComplete = stepIdx < currentIdx;
          const isCurrent = step.key === currentStatus;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isComplete
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                        ? 'bg-emerald-800 border-emerald-800 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isCurrent ? 'text-emerald-800' : isComplete ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {i < mainFlow.length - 1 && (
                <div className="flex-1 mx-3 mt-[-1.25rem]">
                  <div
                    className={`h-0.5 ${
                      stepIdx < currentIdx ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          {actions.map((action) => (
            <button
              key={action.target}
              onClick={() => setConfirmTarget(action.target)}
              disabled={isPending}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                action.target === 'archived'
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-emerald-800 text-white hover:bg-emerald-700'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Permanent delete for archived deals (admin only) */}
      {currentStatus === 'archived' && canArchive(userRole) && (
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Permanently
          </button>
        </div>
      )}

      {userRole === 'viewer' && (
        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
          You have read-only access to this deal.
        </p>
      )}

      {/* Confirmation dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Status Change
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to change the deal status from{' '}
              <span className="font-medium">{STEPS.find((s) => s.key === currentStatus)?.label}</span>
              {' '}to{' '}
              <span className="font-medium">{STEPS.find((s) => s.key === confirmTarget)?.label}</span>?
              {confirmTarget === 'archived' && ' This will archive the deal.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  confirmTarget === 'archived'
                    ? 'bg-slate-600 text-white hover:bg-slate-500'
                    : 'bg-emerald-800 text-white hover:bg-emerald-700'
                }`}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Permanent delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Delete Deal Permanently
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete this deal and all its history. This action <span className="font-semibold text-red-600">cannot be undone</span>.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
