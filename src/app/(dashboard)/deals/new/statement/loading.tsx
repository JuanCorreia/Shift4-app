import { Skeleton } from '@/components/ui/Skeleton';

export default function StatementLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <Skeleton className="h-7 w-52 rounded-lg mb-2" />
      <Skeleton className="h-4 w-80 rounded mb-8" />

      {/* Upload area */}
      <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-10 w-32 rounded-lg mt-2" />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
        <Skeleton className="h-5 w-32 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <div className="h-8 w-8 rounded-full border-[3px] border-slate-200 border-t-[#395542] animate-spin" />
      </div>
    </div>
  );
}
