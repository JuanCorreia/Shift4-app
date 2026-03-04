'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DealError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Deal page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Failed to load deal
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {error.message || 'This deal could not be loaded. It may have been deleted or you may not have access.'}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#395542] text-white text-sm font-medium rounded-lg hover:bg-[#4a6b55] transition-colors shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-slate-400">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
