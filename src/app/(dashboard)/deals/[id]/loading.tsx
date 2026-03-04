import { Skeleton } from '@/components/ui/Skeleton';

export default function DealDetailLoading() {
  return (
    <div>
      {/* Back link */}
      <div className="mb-8">
        <Skeleton className="h-4 w-32 rounded mb-4" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-56 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-36 mt-2 rounded" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6 pb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-20 rounded" />
          ))}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <Skeleton className="h-4 w-28 rounded mb-5" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Spinner */}
      <div className="flex justify-center pt-8">
        <div className="h-8 w-8 rounded-full border-[3px] border-slate-200 border-t-[#395542] animate-spin" />
      </div>
    </div>
  );
}
