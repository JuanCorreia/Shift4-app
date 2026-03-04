'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#395542] text-white text-sm font-medium rounded-lg hover:bg-[#4a6b55] transition-colors shadow-sm"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>

        <p className="mt-4 text-xs text-slate-400">
          If the problem persists, contact support.
          {error.digest && <span className="block mt-1">Error ID: {error.digest}</span>}
        </p>
      </div>
    </div>
  );
}
