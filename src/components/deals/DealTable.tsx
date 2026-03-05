import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq, like, desc, asc, sql, and, gte, lte, SQL } from "drizzle-orm";
import Link from "next/link";
import { FileText } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { getSession } from "@/lib/auth/session";
import { partnerFilter } from "@/lib/db/helpers";

const ITEMS_PER_PAGE = 10;

// Volume tier labels
function getTierLabel(volume: string): string {
  const v = Number(volume);
  if (v >= 50_000_000) return "Tier 1";
  if (v >= 10_000_000) return "Tier 2";
  if (v >= 2_000_000) return "Tier 3";
  if (v >= 500_000) return "Tier 4";
  return "Tier 5";
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

interface DealTableProps {
  status?: string;
  search?: string;
  page?: number;
  sort?: string;
  from?: string;
  to?: string;
}

export async function DealTable({
  status = "all",
  search = "",
  page = 1,
  sort = "newest",
  from,
  to,
}: DealTableProps) {
  // Partner scoping
  const session = await getSession();
  const conditions: SQL[] = [];
  if (session) {
    const pf = partnerFilter(session);
    if (pf) conditions.push(pf);
  }

  if (status && status !== "all") {
    conditions.push(eq(deals.status, status as "draft" | "review" | "approved" | "sent" | "archived"));
  }

  if (search) {
    conditions.push(like(deals.merchantName, `%${search}%`));
  }

  if (from) {
    conditions.push(gte(deals.createdAt, new Date(from)));
  }

  if (to) {
    // Include the entire "to" day
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    conditions.push(lte(deals.createdAt, toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort
  let orderClause;
  switch (sort) {
    case "oldest":
      orderClause = asc(deals.createdAt);
      break;
    case "merchant":
      orderClause = asc(deals.merchantName);
      break;
    case "volume":
      orderClause = desc(deals.annualVolume);
      break;
    default:
      orderClause = desc(deals.createdAt);
  }

  // Count total
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(deals)
    .where(whereClause);

  const totalCount = Number(count);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Fetch deals
  const dealRows = await db
    .select()
    .from(deals)
    .where(whereClause)
    .orderBy(orderClause)
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  if (dealRows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No deals yet</h3>
        <p className="text-sm text-gray-500 mb-6">
          Create your first deal to get started
        </p>
        <Link
          href="/deals/new"
          className="inline-flex items-center px-4 py-2 bg-emerald-800 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          New Deal
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Merchant
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Volume
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tier
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {dealRows.map((deal) => (
              <tr
                key={deal.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-emerald-800"
                  >
                    {deal.merchantName}
                  </Link>
                  {deal.hotelGroup && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {deal.hotelGroup}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatCurrency(deal.annualVolume)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {getTierLabel(deal.annualVolume)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={deal.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {deal.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="text-xs text-emerald-800 hover:text-emerald-900 font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Showing {offset + 1}-{Math.min(offset + ITEMS_PER_PAGE, totalCount)} of{" "}
            {totalCount} deals
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/?page=${p}${status !== "all" ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`}
                className={`px-3 py-1 text-xs rounded ${
                  p === page
                    ? "bg-emerald-800 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
