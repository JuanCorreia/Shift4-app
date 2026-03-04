import { Skeleton } from '@/components/ui/Skeleton';

export default function WizardLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress steps */}
      <div className="flex items-center justify-between mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20 rounded hidden sm:block" />
            {i < 3 && <Skeleton className="h-0.5 w-12 rounded mx-2" />}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <Skeleton className="h-6 w-48 rounded-lg mb-2" />
        <Skeleton className="h-4 w-72 rounded mb-8" />

        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-28 rounded mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-8 gap-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <div className="h-8 w-8 rounded-full border-[3px] border-slate-200 border-t-[#395542] animate-spin" />
      </div>
    </div>
  );
}
