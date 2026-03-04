'use client';

import { Building2 } from 'lucide-react';
import ResearchButton from '../ResearchButton';

export interface MerchantInfoData {
  merchantName: string;
  hotelGroup: string;
  starRating: number;
  propertyCount: number;
  location: string;
}

interface MerchantInfoProps {
  data: MerchantInfoData;
  onChange: (data: Partial<MerchantInfoData>) => void;
  onResearchApply?: (field: string, value: unknown) => void;
}

export default function MerchantInfo({ data, onChange, onResearchApply }: MerchantInfoProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Merchant Information</h2>
            <p className="text-sm text-gray-500">Basic details about the hotel or merchant</p>
          </div>
        </div>
        {onResearchApply && (
          <ResearchButton
            hotelName={data.hotelGroup || data.merchantName}
            onApply={onResearchApply}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Merchant Name */}
        <div className="md:col-span-2">
          <label htmlFor="merchantName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Hotel / Merchant Name <span className="text-red-500">*</span>
          </label>
          <input
            id="merchantName"
            type="text"
            value={data.merchantName}
            onChange={(e) => onChange({ merchantName: e.target.value })}
            placeholder="e.g. Grand Hotel Lisbon"
            required
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
          />
        </div>

        {/* Hotel Group */}
        <div className="md:col-span-2">
          <label htmlFor="hotelGroup" className="block text-sm font-medium text-gray-700 mb-1.5">
            Hotel Group
          </label>
          <input
            id="hotelGroup"
            type="text"
            value={data.hotelGroup}
            onChange={(e) => onChange({ hotelGroup: e.target.value })}
            placeholder="e.g. Marriott, Accor (optional)"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
          />
        </div>

        {/* Star Rating */}
        <div>
          <label htmlFor="starRating" className="block text-sm font-medium text-gray-700 mb-1.5">
            Star Rating
          </label>
          <select
            id="starRating"
            value={data.starRating}
            onChange={(e) => onChange({ starRating: Number(e.target.value) })}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <option key={s} value={s}>
                {'★'.repeat(s)}{'☆'.repeat(5 - s)} ({s} Star{s > 1 ? 's' : ''})
              </option>
            ))}
          </select>
        </div>

        {/* Property Count */}
        <div>
          <label htmlFor="propertyCount" className="block text-sm font-medium text-gray-700 mb-1.5">
            Number of Properties
          </label>
          <input
            id="propertyCount"
            type="number"
            min={1}
            max={999}
            value={data.propertyCount}
            onChange={(e) => onChange({ propertyCount: Math.max(1, Number(e.target.value)) })}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
          />
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
            Location / Country
          </label>
          <input
            id="location"
            type="text"
            value={data.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="e.g. Portugal, Spain, Germany"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-700 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
