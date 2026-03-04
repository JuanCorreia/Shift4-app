'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-slate-200 border-t-[#395542] animate-spin',
          sizeMap[size]
        )}
      />
      {label && (
        <p className="text-sm text-slate-500 font-medium">{label}</p>
      )}
    </div>
  );
}
