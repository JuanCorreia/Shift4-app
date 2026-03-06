import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { ChevronRight } from "lucide-react";

interface DealCardProps {
  id: string;
  merchantName: string;
  hotelGroup?: string | null;
  annualVolume: string;
  status: string;
  createdAt: Date;
  tier: string;
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function DealCard({
  id,
  merchantName,
  hotelGroup,
  annualVolume,
  status,
  createdAt,
  tier,
}: DealCardProps) {
  return (
    <Link
      href={`/deals/${id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow active:bg-gray-50"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {merchantName}
          </h3>
          {hotelGroup && (
            <p className="text-xs text-gray-500 truncate">{hotelGroup}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {tier}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">
            {formatCurrency(annualVolume)}
          </p>
          <p className="text-xs text-gray-400">
            {createdAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
