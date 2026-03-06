# Banyan Payment Gateway — Statement Review & Proposal Engine

## Project Overview
Next.js 14 app for Banyan's hospitality payments team. Automates merchant statement analysis, pricing tier determination, DCC modelling, and proposal generation.

## Tech Stack
- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS 3.4 with Banyan Software brand colors
- **Database:** PostgreSQL 16 via Drizzle ORM (postgres-js driver) — Neon (production), Docker (local)
- **AI:** Anthropic Claude API (OCR, narrative, hotel research)
- **Storage:** Supabase (PDF statement uploads)
- **Export:** React PDF (@react-pdf/renderer) + DOCX (docx package)
- **Auth:** JWT (HTTP-only cookie `shift4_session`, 7-day expiry)
- **Deployment:** Vercel (production), Docker Compose (local)

## Key Architecture Decisions
- **Multi-partner tenancy:** `partners` table, `partner_id` FK on users/deals/team_settings. All queries scoped via `partnerFilter()` helper in `src/lib/db/helpers.ts`. Super admins bypass filters.
- **Auth model:** Shared team invite code per partner (bcrypt-hashed). Users provide code + name/email → MFA OTP via email → JWT session with `partnerId` + `partnerName`.
- **Login security:** Invite codes hashed with bcrypt (cost 10). Login lockout after 10 failed attempts in 30 min. All attempts logged in `login_attempts` table.
- **Roles:** `super_admin` | `admin` | `analyst` | `viewer`. Super admin sees all partners; admin manages their own partner; analyst/viewer scoped to partner deals.
- **Pricing engine:** Pure TypeScript in `src/lib/pricing/` — zero side effects, zero DB/API imports. Runs client-side for instant feedback, server-side on submit for validation.
- **Lazy initialization:** DB, Supabase, and Anthropic clients use lazy init (Proxy pattern for DB) to avoid build-time crashes in standalone Next.js output.
- **Edge Runtime limitation:** `src/middleware.ts` uses cookie-existence check only (no JWT verify) because `jsonwebtoken` doesn't work in Edge Runtime.
- **API key storage:** Anthropic API key AES-256-GCM encrypted in `team_settings.anthropic_api_key` (DB), falls back to `ANTHROPIC_API_KEY` env var. Encryption via `src/lib/crypto.ts` using `ENCRYPTION_KEY` env var.
- **Session refresh:** Dashboard layout auto-renews JWT cookie if expiry is within 2 days.
- **Proposal templates:** 3 designs (Standard green, Premium navy/gold, Minimal white/gray) in `src/lib/export/templates.ts`. Applied to both PDF and DOCX exports.
- **Notifications:** In-app notification bell (30s auto-refresh) + email notifications on deal status changes. Preferences per user (`emailNotifications` column).
- **Audit logging:** Admin actions (role changes, API key updates, invite code changes) logged to `audit_log` table via `logAuditEvent()`.
- **Pricing snapshots:** Saved on deal create/update when pricing recalculates. Viewable in "Price History" tab on deal detail page.

## Brand Colors (Banyan Software)
- Primary: `#395542` (forest green)
- Accent: `#CF987E` (warm tan)
- CSS variables in `globals.css`: primary `147 22% 27%`, secondary `18 40% 65%`

## Deployment
- **Production:** Vercel at `shift4-app.vercel.app` (auto-deploys from GitHub `JuanCorreia/Shift4-app`)
- **Database:** Neon PostgreSQL (`sparkling-leaf-90360563`, org `org-aged-dawn-55264654`)
- **Local:** `docker compose up` on port 8000

## Project Structure
```
src/
├── app/
│   ├── (auth)/login/          # Login page (invite code + MFA/OTP)
│   ├── (dashboard)/           # Protected routes (dashboard at /)
│   │   ├── deals/             # Deal list, new deal, deal detail
│   │   │   ├── new/wizard/    # Mode B: guided wizard
│   │   │   └── new/statement/ # Mode A: PDF upload + OCR
│   │   ├── partners/          # Partner management (super_admin only)
│   │   ├── profile/           # User profile + email notification prefs
│   │   ├── reports/           # Pipeline, Revenue, Forecast tabs (recharts)
│   │   └── settings/          # Admin settings (invite code, API key, roles)
│   └── api/
│       ├── auth/login/        # Login (bcrypt invite code, login lockout, MFA)
│       ├── auth/verify-otp/   # OTP verification (sets partnerId in session)
│       ├── deals/[id]/snapshots/ # Pricing snapshot history
│       ├── notifications/     # In-app notifications (GET, PATCH mark-read)
│       ├── partners/          # Partner CRUD (super_admin only)
│       ├── reports/           # Aggregation queries (pipeline, revenue, forecast)
│       ├── ai/                # OCR, narrative (with tone), research endpoints
│       ├── export/            # PDF/DOCX export (rate-limited, template support)
│       ├── profile/           # Profile update + email notification toggle
│       ├── settings/          # Invite code (bcrypt), user role, API key (AES-256)
│       └── upload/            # Statement upload
├── components/
│   ├── layout/                # Sidebar, TopBar, MobileNav, NotificationBell
│   ├── wizard/                # WizardShell + step components
│   ├── statement/             # UploadZone, ParseResults
│   ├── pricing/               # PricingBreakdown, TierIndicator, EscalationPanel
│   ├── deals/                 # DealTable, DealCard (mobile), StatusBadge, PriceHistoryTab
│   ├── proposal/              # ProposalPreview (template selector, tone selector)
│   └── reports/               # PipelineTab, RevenueTab, ForecastTab (recharts)
└── lib/
    ├── ai/                    # Anthropic client, OCR, narrative (tone), research, translate
    ├── audit.ts               # Audit log helper (logAuditEvent)
    ├── auth/                  # JWT session, OTP
    ├── crypto.ts              # AES-256-GCM encrypt/decrypt for API keys
    ├── db/                    # Drizzle schema + client + helpers (partnerFilter)
    ├── export/                # PDF/DOCX generators + templates (Standard/Premium/Minimal)
    ├── i18n/                  # Lightweight i18n (EN/PT/ES/FR message dictionaries)
    ├── pricing/               # Pure TS pricing engine (5 tiers, DCC, escalations)
    ├── supabase/              # Supabase client + storage helpers
    └── validators/            # Zod schemas
```

## Commands
```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npx vitest run       # Run pricing engine tests
docker compose up    # Run with Docker (port 8000)
```

## Two Deal Creation Modes
- **Mode A (Statement):** Upload PDF → AI OCR extracts data → user reviews → pricing → create deal
- **Mode B (Wizard):** 6-step guided form (merchant → volume → card mix → fees → DCC → review) → pricing → create deal
- Wizard defaults: `dccMarkup: 3.5`, `merchantDccShare: 1.0`, `mbway: 0`
- Processor dropdown: Unicre, Paybryd, Adyen, Stripe, Worldpay, Other (free text fallback)

## Pricing Engine (src/lib/pricing/) — IC++ Model
- **IC++ structure:** Total merchant rate = Interchange + Scheme Fees + Banyan Markup
  - Interchange: weighted by card mix (debit 20bps, credit 30bps, Amex 150bps EU-regulated)
  - Scheme fees: flat 8bps
  - Banyan markup: tier base rate (18-45bps) + card mix adjustments
- 5 tiers: Tier 1 (€100M+, 18bps markup) → Tier 5 (<€1M, 45bps markup)
- Card mix adjustments on markup: Amex >15% (+0.5bps/%), International >30% (+0.3bps/%), Corporate >20% (+0.4bps/%), Debit >40% (-0.2bps/%)
- Card mix tracks: Visa, Mastercard, Amex, MBWay, Other + International/Corporate/Debit percentages
- **DCC revenue:** 3-way split — Merchant (configurable 0.5-1.5%, default 1.0%), Shift4 (fixed 1.5%), Host/Partner (remainder of markup). Default markup: 3.5%
- Escalation system: TIER1_REVIEW, BELOW_FLOOR, HEAVY_AMEX, NEGATIVE_SAVINGS, LOW_MARGIN, UNREALISTIC_DCC, HIGH_INTERNATIONAL, LARGE_DEAL
- Margin = Banyan markup (always positive in IC++ model; healthy when >5bps)
- 42 unit tests

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret
- `ANTHROPIC_API_KEY` — Fallback AI key (can be set in Settings UI instead)
- `ENCRYPTION_KEY` — 32-byte hex for AES-256-GCM API key encryption (generate: `openssl rand -hex 32`)
- `NEXT_PUBLIC_APP_URL` — Base URL for email links (e.g., `https://shift4-app.vercel.app`)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — Email sending (nodemailer)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `NEXT_PUBLIC_SUPABASE_URL` — Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public Supabase anon key

## Test Credentials
- **Invite code:** `shift4team`
- **Admin user:** admin@shift4.com

## Multi-Partner Tenancy
- `partners` table: id, name, slug, logo_url, active
- `users.partner_id` (nullable for super_admin), `deals.partner_id` (NOT NULL), `team_settings.partner_id` (NOT NULL)
- Default partner: "Host Hotel Systems" (slug: `host`)
- `partnerFilter(session)` in `src/lib/db/helpers.ts` — returns `undefined` for super_admin, `eq(deals.partnerId, ...)` for others
- Session JWT: `{ userId, email, name, role, partnerId, partnerName }`
- Stale session guard in dashboard layout: clears cookie + redirects if `partnerId` missing

## DB Tables
Core: `partners`, `users`, `deals`, `deal_history`, `escalations`, `team_settings`, `otp_codes`
New (Phase 1-6): `login_attempts`, `notifications`, `pricing_snapshots`, `audit_log`

## Important Notes
- Dashboard route is at `/` (not `/dashboard`) — uses `(dashboard)` route group
- Never commit `.env` files or API keys
- Rate limiting on AI routes + export routes (in-memory, no Redis). Exports: 10/min per user.
- All AI routes require auth session
- User-visible branding says "Banyan Payment Gateway"; internal variable names still use `shift4` prefix
- ESLint strict on unused imports — Vercel build fails on unused vars
- Proposal hides savings highlight when `annualSavings ≤ 0`
- Critical escalations show as red banner at top of PricingBreakdown
- AI client scoped by `partnerId` (no singleton cache) — each partner uses their own API key
- Security headers configured in `next.config.mjs` (X-Frame-Options, CSP, etc.)
- MobileNav: bottom nav bar on `lg:hidden`, dashboard layout adds `pb-20 lg:pb-0` clearance
- Reports page uses recharts (BarChart, PieChart, LineChart) — ~120KB first load JS
- AI narrative supports tone parameter: `formal` | `conversational` | `technical` (stored in `team_settings.narrative_tone`)
- Translation via Claude API in `src/lib/ai/translate.ts` — EN/PT/ES/FR
- PWA: manifest at `public/manifest.json`, service worker at `public/sw.js`
- recharts Tooltip formatters must use `(value) =>` not `(value: number) =>` (value can be undefined)
