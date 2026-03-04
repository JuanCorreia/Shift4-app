import { z } from "zod";

const coercedNumeric = z.coerce.number();
const coercedOptionalNumeric = z.coerce.number().optional();

export const cardMixSchema = z.object({
  visa: coercedNumeric.min(0).max(100),
  mastercard: coercedNumeric.min(0).max(100),
  amex: coercedNumeric.min(0).max(100),
  other: coercedNumeric.min(0).max(100),
  international: coercedNumeric.min(0).max(100),
  corporate: coercedNumeric.min(0).max(100),
  debit: coercedNumeric.min(0).max(100),
}).refine(
  (data) => {
    const sum = data.visa + data.mastercard + data.amex + data.other;
    return Math.abs(sum - 100) < 0.01;
  },
  { message: "Card mix (Visa + Mastercard + Amex + Other) must sum to 100%" }
);

export const dealFormSchema = z.object({
  merchantName: z.string().min(1, "Merchant name is required").max(255),
  hotelGroup: z.string().max(255).optional(),
  starRating: coercedOptionalNumeric.refine(
    (v) => v === undefined || (v >= 1 && v <= 5),
    { message: "Star rating must be between 1 and 5" }
  ),
  propertyCount: coercedOptionalNumeric.refine(
    (v) => v === undefined || v >= 1,
    { message: "Property count must be at least 1" }
  ),
  location: z.string().max(255).optional(),

  annualVolume: coercedNumeric
    .min(1, "Annual volume must be greater than 0"),
  avgTransactionSize: coercedNumeric
    .min(0.01, "Average transaction size must be greater than 0"),

  cardMixVisa: coercedNumeric.min(0).max(100).default(40),
  cardMixMastercard: coercedNumeric.min(0).max(100).default(35),
  cardMixAmex: coercedNumeric.min(0).max(100).default(15),
  cardMixOther: coercedNumeric.min(0).max(100).default(10),
  cardMixInternational: coercedNumeric.min(0).max(100).default(25),
  cardMixCorporate: coercedNumeric.min(0).max(100).default(15),
  cardMixDebit: coercedNumeric.min(0).max(100).default(30),

  currentProcessor: z.string().max(255).optional(),
  currentBlendedRate: coercedOptionalNumeric,
  currentTxFee: coercedOptionalNumeric,
  currentMonthlyFee: coercedOptionalNumeric,

  dccEligible: z.coerce.boolean().default(false),
  dccUptake: coercedNumeric.min(0).max(100).default(0),
  dccMarkup: coercedNumeric.min(0).max(10).default(2.5),

  mode: z.enum(["wizard", "statement"]).default("wizard"),
}).refine(
  (data) => {
    const sum = data.cardMixVisa + data.cardMixMastercard + data.cardMixAmex + data.cardMixOther;
    return Math.abs(sum - 100) < 0.01;
  },
  { message: "Card mix (Visa + Mastercard + Amex + Other) must sum to 100%", path: ["cardMixVisa"] }
);

export const dealFilterSchema = z.object({
  status: z.enum(["all", "draft", "review", "approved", "sent", "archived"]).default("all"),
  search: z.string().optional(),
  page: coercedNumeric.min(1).default(1),
  sort: z.enum(["newest", "oldest", "merchant", "volume"]).default("newest"),
});

export type DealFormInput = z.infer<typeof dealFormSchema>;
export type DealFilterInput = z.infer<typeof dealFilterSchema>;
