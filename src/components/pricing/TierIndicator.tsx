'use client';

import { useState } from 'react';
import type { TierLevel } from '@/lib/pricing';

const TIER_CONFIG: Record<TierLevel, { color: string; bg: string; border: string; name: string; range: string; rate: string }> = {
  1: { color: 'text-purple-700', bg: 'bg-gradient-to-r from-purple-100 to-amber-100', border: 'border-purple-300', name: 'Enterprise', range: '100M+', rate: '18bps' },
  2: { color: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-300', name: 'Premium', range: '25M - 100M', rate: '25bps' },
  3: { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', name: 'Professional', range: '5M - 25M', rate: '32bps' },
  4: { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', name: 'Standard', range: '1M - 5M', rate: '38bps' },
  5: { color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-300', name: 'Starter', range: '< 1M', rate: '45bps' },
};

interface TierIndicatorProps {
  tier: TierLevel;
  tierName: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function TierIndicator({ tier, tierName, size = 'md' }: TierIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = TIER_CONFIG[tier];

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-5 py-2 text-base',
  };

  return (
    <div className="relative inline-block">
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bg} ${config.color} ${config.border} ${sizeClasses[size]} cursor-help`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="font-bold">T{tier}</span>
        <span className="font-medium">{tierName}</span>
      </span>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
          <div className="font-semibold mb-1.5">Tier {tier}: {config.name}</div>
          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between">
              <span>Volume Range</span>
              <span className="text-white font-medium">{config.range}</span>
            </div>
            <div className="flex justify-between">
              <span>Base Rate</span>
              <span className="text-white font-medium">{config.rate}</span>
            </div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
