'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'table-row';
  width?: string;
  height?: string;
  rounded?: string;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  rounded,
}: SkeletonProps) {
  const variantClasses: Record<string, string> = {
    text: 'h-4 w-full rounded',
    card: 'h-32 w-full rounded-xl',
    avatar: 'h-10 w-10 rounded-full',
    'table-row': 'h-12 w-full rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200',
        variantClasses[variant],
        className
      )}
      style={{
        width: width || undefined,
        height: height || undefined,
        borderRadius: rounded || undefined,
      }}
    />
  );
}
