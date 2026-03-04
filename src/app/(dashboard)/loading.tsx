import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-64 rounded-lg" />
          <Skeleton className="h-4 w-48 mt-2 rounded" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
              <Skeleton variant="avatar" className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-16 rounded" />
        ))}
      </div>

      {/* Search skeleton */}
      <Skeleton className="h-10 w-72 rounded-lg" />

      {/* Table rows */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <Skeleton className="h-4 w-full rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-slate-50 flex items-center gap-4">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 rounded flex-1" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Spinner indicator */}
      <div className="flex justify-center pt-2">
        <div className="h-8 w-8 rounded-full border-[3px] border-slate-200 border-t-[#395542] animate-spin" />
      </div>
    </div>
  );
}
