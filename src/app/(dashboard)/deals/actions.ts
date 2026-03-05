"use server";

import { db } from "@/lib/db";
import { deals, dealHistory } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { dealFormSchema } from "@/lib/validators/deal";
import { eq, and } from "drizzle-orm";
import { partnerFilter } from "@/lib/db/helpers";
import { revalidatePath } from "next/cache";
import { calculatePricing } from "@/lib/pricing/engine";
import type { PricingInput } from "@/lib/pricing";

export async function createDeal(data: unknown) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!session.partnerId) throw new Error("No partner assigned");

  const parsed = dealFormSchema.parse(data);

  // Calculate pricing server-side
  const pricingInput: PricingInput = {
    merchantName: parsed.merchantName,
    annualVolume: parsed.annualVolume,
    avgTransactionSize: parsed.avgTransactionSize,
    cardMix: {
      visa: parsed.cardMixVisa,
      mastercard: parsed.cardMixMastercard,
      amex: parsed.cardMixAmex,
      other: parsed.cardMixOther,
      international: parsed.cardMixInternational,
      corporate: parsed.cardMixCorporate,
      debit: parsed.cardMixDebit,
    },
    currentBlendedRate: parsed.currentBlendedRate ?? 0,
    currentTxFee: parsed.currentTxFee ?? 0,
    currentMonthlyFee: parsed.currentMonthlyFee ?? 0,
    dccEligible: parsed.dccEligible,
    dccUptake: parsed.dccUptake,
    dccMarkup: parsed.dccMarkup,
    propertyCount: parsed.propertyCount ?? 1,
    starRating: parsed.starRating ?? 4,
  };

  const pricingResult = calculatePricing(pricingInput);

  const [deal] = await db
    .insert(deals)
    .values({
      merchantName: parsed.merchantName,
      hotelGroup: parsed.hotelGroup || null,
      starRating: parsed.starRating || null,
      propertyCount: parsed.propertyCount || 1,
      location: parsed.location || null,
      annualVolume: String(parsed.annualVolume),
      avgTransactionSize: String(parsed.avgTransactionSize),
      cardMixVisa: String(parsed.cardMixVisa),
      cardMixMastercard: String(parsed.cardMixMastercard),
      cardMixAmex: String(parsed.cardMixAmex),
      cardMixOther: String(parsed.cardMixOther),
      cardMixInternational: String(parsed.cardMixInternational),
      cardMixCorporate: String(parsed.cardMixCorporate),
      cardMixDebit: String(parsed.cardMixDebit),
      currentProcessor: parsed.currentProcessor || null,
      currentBlendedRate: parsed.currentBlendedRate != null ? String(parsed.currentBlendedRate) : null,
      currentTxFee: parsed.currentTxFee != null ? String(parsed.currentTxFee) : null,
      currentMonthlyFee: parsed.currentMonthlyFee != null ? String(parsed.currentMonthlyFee) : null,
      dccEligible: parsed.dccEligible,
      dccUptake: String(parsed.dccUptake),
      dccMarkup: String(parsed.dccMarkup),
      pricingResult,
      mode: parsed.mode,
      status: "draft",
      partnerId: session.partnerId,
      createdBy: session.userId,
    })
    .returning();

  await db.insert(dealHistory).values({
    dealId: deal.id,
    userId: session.userId,
    action: "created",
  });

  revalidatePath("/");
  revalidatePath("/deals");

  return deal;
}

export async function updateDeal(id: string, data: unknown) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = dealFormSchema.partial().parse(data);

  // Fetch current deal for history comparison (scoped to partner)
  const pf = partnerFilter(session);
  const conditions = pf ? and(eq(deals.id, id), pf) : eq(deals.id, id);
  const [existing] = await db.select().from(deals).where(conditions);
  if (!existing) throw new Error("Deal not found");

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  // Map parsed fields to DB columns, track changes
  const fieldMap: Record<string, { dbKey: string; transform?: (v: unknown) => unknown }> = {
    merchantName: { dbKey: "merchantName" },
    hotelGroup: { dbKey: "hotelGroup" },
    starRating: { dbKey: "starRating" },
    propertyCount: { dbKey: "propertyCount" },
    location: { dbKey: "location" },
    annualVolume: { dbKey: "annualVolume", transform: String },
    avgTransactionSize: { dbKey: "avgTransactionSize", transform: String },
    cardMixVisa: { dbKey: "cardMixVisa", transform: String },
    cardMixMastercard: { dbKey: "cardMixMastercard", transform: String },
    cardMixAmex: { dbKey: "cardMixAmex", transform: String },
    cardMixOther: { dbKey: "cardMixOther", transform: String },
    cardMixInternational: { dbKey: "cardMixInternational", transform: String },
    cardMixCorporate: { dbKey: "cardMixCorporate", transform: String },
    cardMixDebit: { dbKey: "cardMixDebit", transform: String },
    currentProcessor: { dbKey: "currentProcessor" },
    currentBlendedRate: { dbKey: "currentBlendedRate", transform: (v) => v != null ? String(v) : null },
    currentTxFee: { dbKey: "currentTxFee", transform: (v) => v != null ? String(v) : null },
    currentMonthlyFee: { dbKey: "currentMonthlyFee", transform: (v) => v != null ? String(v) : null },
    dccEligible: { dbKey: "dccEligible" },
    dccUptake: { dbKey: "dccUptake", transform: String },
    dccMarkup: { dbKey: "dccMarkup", transform: String },
    mode: { dbKey: "mode" },
  };

  const historyEntries: { field: string; oldValue: string; newValue: string }[] = [];

  for (const [key, config] of Object.entries(fieldMap)) {
    if (key in parsed && parsed[key as keyof typeof parsed] !== undefined) {
      const rawValue = parsed[key as keyof typeof parsed];
      const value = config.transform ? config.transform(rawValue) : rawValue;
      const oldValue = String(existing[config.dbKey as keyof typeof existing] ?? "");
      const newValue = String(value ?? "");

      if (oldValue !== newValue) {
        updateValues[config.dbKey] = value;
        historyEntries.push({ field: key, oldValue, newValue });
      }
    }
  }

  if (Object.keys(updateValues).length > 1) {
    // Recalculate pricing if any pricing-relevant field changed
    const pricingFields = new Set([
      'annualVolume', 'avgTransactionSize',
      'cardMixVisa', 'cardMixMastercard', 'cardMixAmex', 'cardMixOther',
      'cardMixInternational', 'cardMixCorporate', 'cardMixDebit',
      'currentBlendedRate', 'currentTxFee', 'currentMonthlyFee',
      'dccEligible', 'dccUptake', 'dccMarkup', 'propertyCount', 'starRating',
    ]);
    const hasPricingChange = historyEntries.some((e) => pricingFields.has(e.field));

    if (hasPricingChange) {
      // Merge existing values with updates for recalculation
      const merged = { ...existing, ...updateValues };
      const recalcInput: PricingInput = {
        merchantName: String(merged.merchantName),
        annualVolume: Number(merged.annualVolume),
        avgTransactionSize: Number(merged.avgTransactionSize),
        cardMix: {
          visa: Number(merged.cardMixVisa),
          mastercard: Number(merged.cardMixMastercard),
          amex: Number(merged.cardMixAmex),
          other: Number(merged.cardMixOther),
          international: Number(merged.cardMixInternational),
          corporate: Number(merged.cardMixCorporate),
          debit: Number(merged.cardMixDebit),
        },
        currentBlendedRate: Number(merged.currentBlendedRate ?? 0),
        currentTxFee: Number(merged.currentTxFee ?? 0),
        currentMonthlyFee: Number(merged.currentMonthlyFee ?? 0),
        dccEligible: Boolean(merged.dccEligible),
        dccUptake: Number(merged.dccUptake),
        dccMarkup: Number(merged.dccMarkup),
        propertyCount: Number(merged.propertyCount ?? 1),
        starRating: Number(merged.starRating ?? 4),
      };
      updateValues.pricingResult = calculatePricing(recalcInput);
    }

    await db.update(deals).set(updateValues).where(eq(deals.id, id));

    for (const entry of historyEntries) {
      await db.insert(dealHistory).values({
        dealId: id,
        userId: session.userId,
        action: "updated",
        field: entry.field,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
      });
    }
  }

  revalidatePath("/");
  revalidatePath(`/deals/${id}`);

  const [updated] = await db.select().from(deals).where(eq(deals.id, id));
  return updated;
}

export async function deleteDeal(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const pf = partnerFilter(session);
  const conditions = pf ? and(eq(deals.id, id), pf) : eq(deals.id, id);
  const [existing] = await db.select().from(deals).where(conditions);
  if (!existing) throw new Error("Deal not found");

  await db
    .update(deals)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(deals.id, id));

  await db.insert(dealHistory).values({
    dealId: id,
    userId: session.userId,
    action: "status_changed",
    field: "status",
    oldValue: existing.status,
    newValue: "archived",
  });

  revalidatePath("/");
  revalidatePath(`/deals/${id}`);
}

export async function updateDealStatus(id: string, newStatus: "draft" | "review" | "approved" | "sent" | "archived") {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const pf = partnerFilter(session);
  const conditions = pf ? and(eq(deals.id, id), pf) : eq(deals.id, id);
  const [existing] = await db.select().from(deals).where(conditions);
  if (!existing) throw new Error("Deal not found");

  await db
    .update(deals)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(deals.id, id));

  await db.insert(dealHistory).values({
    dealId: id,
    userId: session.userId,
    action: "status_changed",
    field: "status",
    oldValue: existing.status,
    newValue: newStatus,
  });

  revalidatePath("/");
  revalidatePath(`/deals/${id}`);
}
