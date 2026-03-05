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
- **Auth model:** Shared team invite code per partner (not per-user passwords). Users provide code + name/email → get JWT with `partnerId` + `partnerName`.
- **Roles:** `super_admin` | `admin` | `analyst` | `viewer`. Super admin sees all partners; admin manages their own partner; analyst/viewer scoped to partner deals.
- **Pricing engine:** Pure TypeScript in `src/lib/pricing/` — zero side effects, zero DB/API imports. Runs client-side for instant feedback, server-side on submit for validation.
- **Lazy initialization:** DB, Supabase, and Anthropic clients use lazy init (Proxy pattern for DB) to avoid build-time crashes in standalone Next.js output.
- **Edge Runtime limitation:** `src/middleware.ts` uses cookie-existence check only (no JWT verify) because `jsonwebtoken` doesn't work in Edge Runtime.
- **API key storage:** Anthropic API key stored in `team_settings.anthropic_api_key` (DB), falls back to `ANTHROPIC_API_KEY` env var.

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
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected routes (dashboard at /)
│   │   ├── deals/             # Deal list, new deal, deal detail
│   │   │   ├── new/wizard/    # Mode B: guided wizard
│   │   │   └── new/statement/ # Mode A: PDF upload + OCR
│   │   ├── partners/           # Partner management (super_admin only)
│   │   ├── profile/           # User profile page
│   │   └── settings/          # Admin settings (invite code, API key, roles)
│   └── api/
│       ├── auth/login/        # Login endpoint (resolves partner from invite code)
│       ├── auth/verify-otp/   # OTP verification (sets partnerId in session)
│       ├── partners/          # Partner CRUD (super_admin only)
│       ├── ai/                # OCR, narrative, research endpoints
│       ├── export/            # PDF/DOCX export
│       ├── profile/           # Profile update
│       ├── settings/          # Invite code, user role, API key
│       └── upload/            # Statement upload
├── components/
│   ├── layout/                # Sidebar, TopBar
│   ├── wizard/                # WizardShell + step components
│   ├── statement/             # UploadZone, ParseResults
│   ├── pricing/               # PricingBreakdown, TierIndicator, EscalationPanel
│   ├── deals/                 # DealTable, StatusBadge, StatusWorkflow
│   └── proposal/              # ProposalPreview
└── lib/
    ├── ai/                    # Anthropic client, OCR, narrative, research
    ├── auth/                  # JWT session, OTP
    ├── db/                    # Drizzle schema + client + helpers (partnerFilter)
    ├── export/                # PDF/DOCX generators
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

## Pricing Engine (src/lib/pricing/)
- 5 tiers: Tier 1 (€100M+, 18bps) → Tier 5 (<€1M, 45bps)
- Card mix adjustments, international exposure, volume-based rates
- DCC revenue projection (eligible volume × uptake × markup)
- Escalation system: mandatory review triggers, below-floor warnings, negative savings alerts
- 39 unit tests

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret
- `ANTHROPIC_API_KEY` — Fallback AI key (can be set in Settings UI instead)
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

## Important Notes
- Dashboard route is at `/` (not `/dashboard`) — uses `(dashboard)` route group
- Never commit `.env` files or API keys
- Rate limiting on AI routes (in-memory, no Redis)
- All AI routes require auth session
- User-visible branding says "Banyan Payment Gateway"; internal variable names still use `shift4` prefix
- ESLint strict on unused imports — Vercel build fails on unused vars
