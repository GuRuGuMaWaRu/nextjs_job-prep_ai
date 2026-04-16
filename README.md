# Landr - AI-Powered Job Preparation Platform

This project is a full-stack Next.js application for structured interview preparation. It combines AI-assisted practice flows (questions, interview feedback, resume analysis), user authentication, and subscription-gated limits using Stripe.

## Purpose

Landr helps users prepare for job interviews through three core workflows:

- **AI mock interviews** with post-session feedback.
- **Technical question practice** with generated questions and AI review.
- **Resume analysis** against a specific job description.

It also supports plan-based access (`free` vs `pro`) and keeps user progress tied to job-specific prep records.

## Feature Overview

- Public landing page with marketing content and pricing.
- Email/password authentication with database-backed sessions.
- Job info management (create, edit, delete, view).
- Interview flows per job info, including generated feedback.
- Technical question generation and answer feedback.
- Resume analysis endpoint that evaluates ATS fit and job alignment.
- Upgrade and subscription management through Stripe Checkout + Billing Portal.
- API protection via Arcjet on API routes.

## Architecture Overview

### Runtime and stack

- **Framework:** Next.js App Router (`app/`)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM/migrations:** Drizzle ORM + Drizzle Kit
- **AI:** Vercel AI SDK + Google Gemini
- **Voice interview session boundary:** Hume React Voice provider
- **Payments:** Stripe subscriptions + webhooks
- **UI:** Tailwind CSS + shadcn/ui + Radix UI

### Project layout

- `app/` - routes, layouts, pages, and route handlers (`app/api/**/route.ts`)
- `core/features/` - feature modules with layered structure
- `core/services/` - external service integrations (AI/Hume)
- `core/drizzle/` - schema, db client, migrations
- `core/data/env/` - typed env validation and derived runtime config
- `proxy.ts` - middleware for auth redirect rules and Arcjet API protection

### Layered feature pattern

Most domain features are structured as:

1. `actions.ts` - input validation + user-facing error shaping
2. `service.ts` - business logic + permission checks
3. `dal.ts` - data access boundary + DB error translation/cache tags
4. `db.ts` - direct Drizzle queries

This separation is used in modules like `jobInfos`, `questions`, and `interviews`.

### Request and auth flow

1. Requests pass through `proxy.ts`.
2. Public routes are allowed; private routes require a `session_token` cookie.
3. API routes (except Stripe webhook paths) are protected by Arcjet.
4. Server actions/route handlers resolve user context via `getCurrentUser()`.
5. Features execute service/DAL/database logic and return data or stream AI output.

### Data model (high level)

Key tables include:

- `users` (plan + Stripe identifiers)
- `sessions`
- `job_info`
- `interviews`
- `questions`
- `stripe_events` (webhook idempotency)
- token tables for verification/password reset workflows

## Setup Instructions

### 1) Prerequisites

- Node.js 20+
- npm
- Neon Postgres project (recommended)
- (Optional for billing work) Stripe CLI

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment variables

Create `.env.local` in the project root (or your preferred env file) and add:

```env
# Database
DB_HOST=ep-xxxxxxx.region.aws.neon.tech
DB_PORT=5432
DB_USER=your_neon_user
DB_PASSWORD=your_neon_password
DB_NAME=your_neon_db
DB_SSLMODE=require

# Security / infra
ARCJET_KEY=your_arcjet_key

# AI providers
GEMINI_API_KEY=your_gemini_key
HUME_API_KEY=your_hume_api_key
HUME_SECRET_KEY=your_hume_secret_key
NEXT_PUBLIC_HUME_CONFIG_ID=your_hume_config_id

# Stripe (optional in local development if you are not testing billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...        # or STRIPE_PRO_PRODUCT_ID=prod_...
STRIPE_PRO_PRODUCT_ID=prod_...
APP_URL=http://localhost:3000
```

Notes:

- The app builds `DATABASE_URL` internally from `DB_*` vars.
- Stripe helpers prefer `APP_URL`, then `VERCEL_URL`, then localhost in development.
- Some Stripe vars are optional at schema level, but required for fully functional checkout/webhooks.

### 4) Connect to Neon database

Create (or reuse) a Neon project and copy its connection details into your `DB_*` variables.
If you're deploying on Vercel, set the same variables in Vercel project environment settings.

Optional local fallback (legacy):

If you need a fully local database for offline work, you can still run:

```bash
docker compose up -d
```

and switch `DB_*` values back to local Postgres.

### 5) Prepare database schema

Choose one workflow:

- Apply schema directly:

```bash
npm run db:push
```

- Or generate + migrate:

```bash
npm run db:generate
npm run db:migrate
```

### 6) Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration Options

### Server environment (`core/data/env/server.ts`)

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL connection parts
- `DB_SSLMODE` - optional SSL mode suffix for DB URL
- `ARCJET_KEY` - Arcjet middleware protection
- `HUME_API_KEY`, `HUME_SECRET_KEY` - Hume backend access
- `GEMINI_API_KEY` - Google Gemini model access
- `STRIPE_SECRET_KEY` - Stripe API client
- `STRIPE_WEBHOOK_SECRET` - webhook signature validation
- `STRIPE_PRO_PRICE_ID` / `STRIPE_PRO_PRODUCT_ID` - subscription product mapping
- `APP_URL` - canonical base URL for redirects
- `OAUTH_REDIRECT_URL_BASE` - must be a URL in the form of `http://localhost:3000/api/oauth/` (with a trailing slash)
- `DISCORD_CLIENT_ID` - Discord OAuth client ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth client secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret

### Client environment (`core/data/env/client.ts`)

- `NEXT_PUBLIC_HUME_CONFIG_ID` - public Hume voice config used by the client provider

### App-level behavioral config

- `core/features/auth/constants.ts`
  - `SESSION_DURATION_MS` (30 days)
  - `SESSION_REFRESH_THRESHOLD_MS` (7 days)
  - session cookie name/options (`session_token`, `httpOnly`, etc.)
- `core/features/auth/permissions.ts`
  - free-plan limits (currently interviews/questions/resume analyses)
  - plan-to-permission mapping for `free` and `pro`
- `next.config.ts`
  - `cacheComponents: true`

## Common Development Tasks

### Start and build

```bash
npm run dev
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

### Database tasks

```bash
npm run db:push
npm run db:generate
npm run db:migrate
npm run db:studio
```

### Stripe local webhook forwarding

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

Copy the printed signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

### Where key API routes live

- `app/api/ai/resumes/analyze/route.ts`
- `app/api/ai/questions/generate-question/route.ts`
- `app/api/ai/questions/generate-feedback/route.ts`
- `app/api/stripe/create-checkout-session/route.ts`
- `app/api/stripe/create-portal-session/route.ts`
- `app/api/stripe/cancel-subscription/route.ts`
- `app/api/stripe/webhooks/route.ts`

## Development Notes

- There is currently no test runner script in `package.json`. If you add tests, follow the workspace convention (`Jest` + React Testing Library, one `*.test.ts` file per source file).
- Stripe webhook handling is explicitly idempotent via the `stripe_events` table and re-fetching subscription state from Stripe.
- The middleware intentionally skips Arcjet checks for Stripe routes and applies Arcjet mainly to `/api/**`.
- Neon is a strong fit for Vercel deployments because it provides managed Postgres with straightforward hosted connection management (no containerized DB required in production).
