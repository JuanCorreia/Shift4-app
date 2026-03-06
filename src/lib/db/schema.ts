import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  integer,
  numeric,
  boolean,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["analyst", "admin", "viewer", "super_admin"]);

// Partners table
export const partners = pgTable("partners", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logoUrl: varchar("logo_url", { length: 500 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: roleEnum("role").notNull().default("analyst"),
  partnerId: uuid("partner_id").references(() => partners.id),
  inviteCode: varchar("invite_code", { length: 255 }),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamSettings = pgTable("team_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  inviteCode: varchar("invite_code", { length: 255 }).notNull().unique(),
  teamName: varchar("team_name", { length: 255 }).notNull(),
  anthropicApiKey: varchar("anthropic_api_key", { length: 500 }),
  narrativeTone: varchar("narrative_tone", { length: 20 }).default("formal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type TeamSettings = typeof teamSettings.$inferSelect;
export type NewTeamSettings = typeof teamSettings.$inferInsert;

// Deal status enum
export const dealStatusEnum = pgEnum('deal_status', ['draft', 'review', 'approved', 'sent', 'archived']);

// Deals table
export const deals = pgTable('deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantName: varchar('merchant_name', { length: 255 }).notNull(),
  hotelGroup: varchar('hotel_group', { length: 255 }),
  starRating: integer('star_rating'),
  propertyCount: integer('property_count').default(1),
  location: varchar('location', { length: 255 }),

  // Volume & pricing input
  annualVolume: numeric('annual_volume', { precision: 15, scale: 2 }).notNull(),
  avgTransactionSize: numeric('avg_transaction_size', { precision: 10, scale: 2 }).notNull(),

  // Card mix (stored as percentages)
  cardMixVisa: numeric('card_mix_visa', { precision: 5, scale: 2 }).default('40'),
  cardMixMastercard: numeric('card_mix_mastercard', { precision: 5, scale: 2 }).default('35'),
  cardMixAmex: numeric('card_mix_amex', { precision: 5, scale: 2 }).default('15'),
  cardMixMbway: numeric('card_mix_mbway', { precision: 5, scale: 2 }).default('0'),
  cardMixOther: numeric('card_mix_other', { precision: 5, scale: 2 }).default('10'),
  cardMixInternational: numeric('card_mix_international', { precision: 5, scale: 2 }).default('25'),
  cardMixCorporate: numeric('card_mix_corporate', { precision: 5, scale: 2 }).default('15'),
  cardMixDebit: numeric('card_mix_debit', { precision: 5, scale: 2 }).default('30'),

  // Current processor info
  currentProcessor: varchar('current_processor', { length: 255 }),
  currentBlendedRate: numeric('current_blended_rate', { precision: 6, scale: 2 }),
  currentTxFee: numeric('current_tx_fee', { precision: 6, scale: 4 }),
  currentMonthlyFee: numeric('current_monthly_fee', { precision: 10, scale: 2 }),

  // DCC
  dccEligible: boolean('dcc_eligible').default(false),
  dccUptake: numeric('dcc_uptake', { precision: 5, scale: 2 }).default('0'),
  dccMarkup: numeric('dcc_markup', { precision: 5, scale: 2 }).default('3.5'),
  merchantDccShare: numeric('merchant_dcc_share', { precision: 5, scale: 2 }).default('1.0'),

  // Pricing results (stored as JSON)
  pricingResult: jsonb('pricing_result'),

  // AI-generated content
  narrative: text('narrative'),

  // Statement upload
  statementUrl: varchar('statement_url', { length: 500 }),
  ocrData: jsonb('ocr_data'),

  // Mode
  mode: varchar('mode', { length: 10 }).notNull().default('wizard'),

  // Status & ownership
  status: dealStatusEnum('status').default('draft').notNull(),
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  assignedTo: uuid('assigned_to').references(() => users.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Deal history for audit trail
export const dealHistory = pgTable('deal_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  field: varchar('field', { length: 100 }),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Escalations
export const escalations = pgTable('escalations', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  message: text('message').notNull(),
  details: text('details'),
  resolved: boolean('resolved').default(false),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// OTP codes for MFA
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type OtpCode = typeof otpCodes.$inferSelect;

// Login attempts for lockout
export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  ip: varchar('ip', { length: 100 }).notNull(),
  userAgent: varchar('user_agent', { length: 500 }),
  success: boolean('success').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type LoginAttempt = typeof loginAttempts.$inferSelect;

// In-app notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'cascade' }),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Pricing snapshots for price history
export const pricingSnapshots = pgTable('pricing_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  snapshotAt: timestamp('snapshot_at').defaultNow().notNull(),
  pricingResult: jsonb('pricing_result').notNull(),
  triggerAction: varchar('trigger_action', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PricingSnapshot = typeof pricingSnapshots.$inferSelect;

// Audit log
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }),
  details: jsonb('details'),
  ip: varchar('ip', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;

// Inferred types for deals
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type DealHistory = typeof dealHistory.$inferSelect;
export type NewDealHistory = typeof dealHistory.$inferInsert;
export type Escalation = typeof escalations.$inferSelect;
export type NewEscalation = typeof escalations.$inferInsert;
