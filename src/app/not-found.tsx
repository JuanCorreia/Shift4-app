import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Brand mark */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#395542] mb-8">
          <span className="text-2xl font-bold text-white">B</span>
        </div>

        <h1 className="text-6xl font-bold text-[#395542] mb-3">404</h1>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Page not found
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 bg-[#395542] text-white text-sm font-medium rounded-lg hover:bg-[#4a6b55] transition-colors shadow-sm"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <p className="mt-12 text-xs text-slate-400">
          Banyan Payment Gateway
        </p>
      </div>
    </div>
  );
}
