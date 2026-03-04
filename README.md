# Shift4 Hospitality — Statement Review & Proposal Engine

A Next.js application for Shift4's hospitality payments team that automates merchant statement analysis, pricing tier determination, DCC (Dynamic Currency Conversion) modelling, and personalised proposal generation.

## Features

- **Statement Upload (Mode A):** Upload merchant processing statements (PDF) for AI-powered OCR analysis using Claude Vision. Extracted data is reviewed and edited before pricing.
- **Guided Wizard (Mode B):** Step-by-step form to manually enter merchant data with optional AI-powered hotel research to auto-fill fields.
- **Pricing Engine:** Pure TypeScript engine with 5 pricing tiers, card mix adjustments, DCC revenue projections, and automatic escalation flagging.
- **Proposal Generation:** AI-generated executive summaries with export to PDF and DOCX. Editable narrative before export.
- **Deal Management:** Full deal lifecycle (draft → review → approved → sent → archived) with audit history, escalation tracking, and role-based access.
- **Team Settings:** Invite code management, user role assignment, and Anthropic API key configuration.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4 |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| AI | Anthropic Claude API |
| Storage | Supabase |
| Export | React PDF, docx |
| Auth | JWT (HTTP-only cookies) |
| Deployment | Docker Compose |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for containerised setup)
- Anthropic API key (for AI features)
- Supabase project (for file storage)

### Docker Setup (Recommended)

1. Clone the repository
2. Create `.env` file:
   ```env
   DATABASE_URL=postgresql://shift4user:shift4pass@db:5432/shift4db
   JWT_SECRET=your-jwt-secret-here
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run:
   ```bash
   docker compose up --build
   ```
4. Open [http://localhost:8000](http://localhost:8000)

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up PostgreSQL and create `.env.local` with the variables above
3. Run migrations:
   ```bash
   npx drizzle-kit push
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Authentication

The app uses a shared team invite code model (not per-user passwords):

1. An admin sets the team invite code in Settings
2. New users enter the invite code + their name/email to join
3. Users receive a JWT session (7-day expiry)
4. Admins can assign roles: **Admin**, **Analyst**, or **Viewer**

**Default credentials (Docker):**
- Invite code: `shift4team`
- Admin email: `admin@shift4.com`

## Deal Creation Modes

### Mode A: Statement Upload
1. Upload a merchant's processing statement (PDF)
2. AI extracts merchant name, volumes, fees, and card mix
3. Review and edit extracted data (low-confidence fields highlighted)
4. View calculated pricing with Shift4 rates
5. Create deal

### Mode B: Guided Wizard
1. Enter merchant info (name, hotel group, star rating)
2. Enter volume data (annual volume, avg transaction size)
3. Set card mix percentages (auto-constrained to 100%)
4. Enter current processor fees
5. Configure DCC parameters
6. Review summary and create deal

## Pricing Engine

The pricing engine (`src/lib/pricing/`) is pure TypeScript with zero side effects:

| Tier | Volume | Base Rate |
|------|--------|-----------|
| 1 | >= EUR 100M | 18 bps |
| 2 | >= EUR 25M | 25 bps |
| 3 | >= EUR 5M | 32 bps |
| 4 | >= EUR 1M | 38 bps |
| 5 | < EUR 1M | 45 bps |

Rates are adjusted based on card mix (Amex surcharge, international exposure), volume, and property count. DCC revenue is calculated separately for eligible international transactions.

### Escalation System
- **Critical:** Tier 1 deals require mandatory review, below-floor rate warnings
- **Warning:** Heavy Amex exposure, negative savings, low margin, unrealistic DCC uptake

## Project Structure

```
src/
├── app/
│   ├── (auth)/                # Login page
│   ├── (dashboard)/           # Protected routes
│   │   ├── deals/             # Deal CRUD, wizard, statement upload
│   │   └── settings/          # Admin settings
│   └── api/                   # API routes (auth, AI, export, settings)
├── components/                # React components
│   ├── layout/                # Sidebar, TopBar
│   ├── wizard/                # 6-step wizard
│   ├── statement/             # Upload and OCR review
│   ├── pricing/               # Pricing display components
│   ├── deals/                 # Deal table, status, workflow
│   └── proposal/              # Proposal preview and export
└── lib/                       # Business logic
    ├── ai/                    # Anthropic API integration
    ├── auth/                  # JWT session management
    ├── db/                    # Database schema and client
    ├── export/                # PDF/DOCX generation
    ├── pricing/               # Pricing engine (pure TS)
    ├── supabase/              # File storage
    └── validators/            # Zod schemas
```

## Testing

```bash
npx vitest run          # Run all tests
npx vitest run --watch  # Watch mode
```

The pricing engine has 39 unit tests covering tier boundaries, card mix adjustments, DCC calculations, escalation rules, and edge cases.

## API Key Configuration

The Anthropic API key can be configured in two ways:
1. **Settings UI:** Admin can set the API key in Settings > Anthropic API Key (stored in database)
2. **Environment variable:** Set `ANTHROPIC_API_KEY` in `.env` (fallback if not set in UI)

The UI-configured key takes priority over the environment variable.

## License

Proprietary — Shift4 / Banyan Software
