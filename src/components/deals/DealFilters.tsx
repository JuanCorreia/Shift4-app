'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState, useCallback } from 'react';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'review', label: 'Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'sent', label: 'Sent' },
  { key: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'volume', label: 'Volume High \u2192 Low' },
  { key: 'merchant', label: 'Merchant A \u2192 Z' },
];

export default function DealFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentFrom = searchParams.get('from') || '';
  const currentTo = searchParams.get('to') || '';

  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all' && value !== 'newest') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset page on filter change
      params.delete('page');
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchValue });
  }

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => updateParams({ status: tab.key })}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              currentStatus === tab.key
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search, date range, sort row */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search merchant name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Date from */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={currentFrom}
            onChange={(e) => updateParams({ from: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={currentTo}
            onChange={(e) => updateParams({ to: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
        </div>

        {/* Sort */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            Sort
          </label>
          <select
            value={currentSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
