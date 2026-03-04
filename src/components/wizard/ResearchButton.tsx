'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { HotelResearchResult } from '@/lib/ai/research';
import ResearchResults from './ResearchResults';

interface ResearchButtonProps {
  hotelName: string;
  onApply: (field: string, value: unknown) => void;
}

export default function ResearchButton({ hotelName, onApply }: ResearchButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HotelResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function handleResearch() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Research failed');
      }

      const data: HotelResearchResult = await res.json();
      setResult(data);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleResearch}
        disabled={!hotelName.trim() || loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {loading ? 'Researching...' : 'Research with AI'}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {showModal && result && (
        <ResearchResults
          result={result}
          onApply={onApply}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
