# OfferPilot - AI-Powered Job Preparation Platform

This project is a full-stack Next.js application for structured interview preparation. It combines AI-assisted practice flows (questions, interview feedback, resume analysis), user authentication, and subscription-gated limits using Stripe.

## Purpose

OfferPilot helps users prepare for job interviews through three core workflows:

- **AI mock interviews** with post-session feedback.
- **Technical question practice** with generated questions and AI review.
- **Resume analysis** against a specific job description.

It also supports plan-based access (`free` vs `pro`) and keeps user progress tied to job-specific prep records.

## Feature Overview

- Public landing page with marketing content and pricing.
- Email/password authentication with database-backed sessions.
- OAuth sign-in via Google, GitHub, and Discord (optional per provider).
- Job info management (create, edit, delete, view).
- Interview flows per job info, including generated feedback.
- Technical question generation and answer feedback.
- Resume analysis endpoint that evaluates ATS fit and job alignment.
- Upgrade and subscription management through Stripe Checkout + Billing Portal (checkout fulfillment via `/api/stripe/checkout-return`; upgrade page shows current-plan badge and payment-attention alerts).
- Cancel-at-period-end reminder banner for Pro users who canceled but retain access until billing period end.
- API protection via Arcjet on API routes (middleware shield/bot limits plus per-user token buckets on AI-heavy endpoints).
- User-friendly error toasts for plan limits, rate limits, Hume unavailability, and resume upload validation (`core/lib/errorToast.tsx`).

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
- `core/data/constants.ts` - shared permission identifiers, plan limits (`PERMISSIONS`, `PLAN_LIMITS`), and domain error tokens (`PLAN_LIMIT_MESSAGE`, `RATE_LIMIT_MESSAGE`, etc.)
- `core/lib/` - shared helpers (`getCurrentUser`, `requireUser`, `assertUUID`, domain error classes in `errors.ts`, `errorToast`)
- `proxy.ts` - middleware for auth redirect rules and Arcjet API protection

### Layered feature pattern

Most domain features are structured as:

1. `actions.ts` - Zod/UUID input validation (`assertUUID()` for Postgres UUID params) + user-facing `ActionResult` shaping; page-level reads may throw
2. `service.ts` - auth (`requireUser()`), ownership, plan limits, rate limits, and business rules
3. `dal.ts` - data access boundary + DB error translation, cache tags, and post-write cache revalidation
4. `db.ts` - direct Drizzle queries

This separation is used in modules like `jobInfos`, `questions`, `interviews`, and `users`. Plan limits are defined in `core/data/constants.ts`; feature `service.ts` files call `hasPermission(permission, user)` from `core/features/auth/permissions.ts`. Resume analysis quota and persistence live in `core/features/resumeAnalysis/` (`service.ts` + `db.ts`; the analyze API route calls `reserveResumeAnalysisUsageService` before streaming AI output).

### Request and auth flow

1. Requests pass through `proxy.ts`.
2. `/api/stripe/webhooks` and `/api/cron/*` skip Arcjet and session auth (`/api/stripe/webhooks` uses Stripe signature verification; cron routes require `Bearer ${CRON_SECRET}` in the handler).
3. Arcjet protects other `/api/**` routes except all `/api/stripe/*` paths (those routes validate requests in their handlers). Middleware applies shield, bot detection, and a 100 requests/minute sliding window. AI-heavy routes and interview services add a second per-user token bucket (capacity 12, refill 4/day) keyed by `userId`.
4. Public routes (`/`, `/sign-in`, `/sign-up`, `/api/oauth`) allow access without a session; if a `session_token` cookie is present, middleware redirects to `/app`.
5. Private routes require a `session_token` cookie; missing cookies redirect to `/` (landing). Users sign in from there via the Sign In link.
6. Server actions, route handlers, and server components resolve the session via `getCurrentUser()` (`core/lib/getCurrentUser.ts`), wrapped in React `cache()` for per-request deduplication. Services that must hard-fail use `requireUser()` (`core/lib/requireUser.ts`).
7. `app/app/layout.tsx` validates the session once for all `/app/**` routes, passes `user` to `Navbar`, and redirects expired or invalid sessions to `/api/auth/evict` (clears the cookie and redirects to `/`). Individual pages rely on this layout guard plus service-layer `requireUser()` for mutations.
8. Features execute service/DAL/database logic and return data or stream AI output.

### Data model (high level)

Key tables include:

- `users` (plan + Stripe identifiers)
- `sessions`
- `user_oauth_accounts` (linked OAuth provider accounts)
- `job_info`
- `interviews`
- `questions`
- `resume_analyses` (per job info; used for free-plan usage counting and quota reservation)
- `stripe_events` (webhook idempotency)
- token tables for verification/password reset workflows

## Setup Instructions

### 1) Prerequisites

- Node.js 21.7+ (see `engines` in `package.json`)
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
CRON_SECRET=123456789012345
OAUTH_REDIRECT_URL_BASE=http://localhost:3000/api/oauth/

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
- `DB_SSLMODE` is optional; omit it for local Docker Postgres.
- `CRON_SECRET` must be exactly 15 characters.
- `OAUTH_REDIRECT_URL_BASE` is required even when OAuth providers are not configured.
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
- `CRON_SECRET` - exactly 15 characters; authorizes `/api/cron/*` routes (Vercel Cron sends it as a Bearer token)
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
- `core/data/constants.ts`
  - `PERMISSIONS` identifiers (`interviews`, `questions`, `resume_analyses`)
  - `PLAN_LIMITS` for `free` and `pro` (free: 1 completed voice interview, 10 generated questions, and 3 resume analyses lifetime — total row counts, not reset monthly; pro: unlimited / `null` limits)
  - Domain error tokens returned by server actions and API routes (`PLAN_LIMIT_MESSAGE`, `RATE_LIMIT_MESSAGE`, `HUME_UNAVAILABLE_MESSAGE`, `FILE_SIZE_TOO_LARGE_MESSAGE`, `FILE_TYPE_NOT_SUPPORTED_MESSAGE`)
- `core/lib/errorToast.tsx`
  - Converts domain error tokens into user-facing Sonner toasts (plan-limit toasts include an upgrade link)
- `core/features/auth/permissions.ts`
  - `hasPermission(permission, user)` — plan-limit check for a given authenticated user against current usage counts
  - `getUserPlan()` and `getUserSubscriptionInfo()` for upgrade and billing UI
- `next.config.ts`
  - `cacheComponents: true`

## Common Development Tasks

### Start and build

```bash
npm run dev
npm run build
npm run start
```

### Lint and typecheck

```bash
npm run lint
npm run typecheck
```

Use `npm run check` to auto-fix lint and format issues locally. CI uses the read-only equivalent:

```bash
npm run check:ci
npm run typecheck
npm test
```

### Continuous integration

CI is split across three workflows:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) - Biome lint and format checks (`npm run check:ci`), TypeScript (`npm run typecheck`), and Jest tests (`npm test`)
- [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) - Playwright smoke tests (`npm run test:e2e`)
- [`.github/workflows/pr-title.yml`](.github/workflows/pr-title.yml) - validates PR titles match Conventional Commit style (`type(scope): summary`)

After the workflows have run at least once on `main`, enable **Require status checks to pass before merging** in GitHub branch protection and select the **Lint and test**, **Playwright Tests**, and **Validate PR title** checks.

### End-to-end tests (Playwright)

Playwright tests require a dedicated test database. Copy `.env.test.example` to `.env.test` and point it at that database. Schema sync and data reset run automatically at the start of each e2e run via `e2e/globalSetup.ts` (`drizzle-kit push --force`, then truncate).

Stop any other dev server on port 3000 before running e2e locally, or Playwright may reuse it against the wrong database. In CI, Playwright always starts a fresh `dev:test` server.

For local Docker Postgres, run `docker compose up -d`, use `DB_HOST=localhost`, and omit `DB_SSLMODE`. For Neon, use a separate branch/database and set `DB_SSLMODE=require`.

To sync the test schema manually (optional, for debugging):

```bash
npx dotenv -e .env.test -- npm run db:push -- --force
```

Run the E2E suite with:

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

The smoke specs live in `e2e/smoke/`:

- `landingPage.spec.ts` — public landing page content and sign-up/sign-in navigation.
- `auth.spec.ts` — sign-up, sign-in, logout, protected-route redirects to the landing page (`/`), and auth error states (wrong password, duplicate email).
- `userFlow.spec.ts` — signed-in flows: navbar upgrade link, job info create/edit/delete, empty form validation, job info section navigation (interviews, questions, resume), and the upgrade page.
- `planLimits.spec.ts` — free-plan interview and questions limit UI (`PlanLimitAlert`, disabled question generation, upgrade link), and resume analysis limit redirect to the upgrade page.
- `aiQuestions.spec.ts` — mocked AI question generation (route interception), difficulty selection, question display, answer input, and mocked answer feedback.
- `aiResume.spec.ts` — mocked resume analysis upload and streamed results display.

Database-level specs live in `e2e/db/`:

- `resumeAnalysisReservation.spec.ts` — concurrent free-plan quota reservation at the limit boundary (`tryInsertResumeAnalysisDb`).

Shared setup helpers live in `e2e/helpers/`. Authenticated specs use the `authedTest` fixture from `e2e/fixtures/auth.ts`. Playwright starts the app via `npm run dev:test` (loads `.env.test`).

Local `npm run test:e2e` runs Chromium only; Firefox and WebKit projects are skipped outside CI (`playwright.config.ts` uses `testIgnore` when `CI` is unset).

`e2e/globalSetup.ts` performs that schema sync and reset. Keep the test database separate: `e2e/resetDatabase.ts` refuses to truncate unless the derived `DATABASE_URL` hostname matches `E2E_DB_HOST` or `DB_HOST`.

CI runs Playwright from [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) on pull requests and pushes to `main`/`master`. It expects a GitHub secret named `E2E_ENV_FILE` containing the full `.env.test` contents. Failed runs upload the `playwright-report` artifact, and traces are collected on the first retry.

Out of scope for E2E for now:

- Stripe checkout and webhooks
- OAuth provider sign-in flows
- Live AI generation (Gemini) and live Hume voice

Keep those covered by Jest or integration tests until the E2E scope expands.

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
- `app/api/auth/evict/route.ts`
- `app/api/oauth/[provider]/route.ts`
- `app/api/stripe/create-checkout-session/route.ts`
- `app/api/stripe/checkout-return/route.ts`
- `app/api/stripe/create-portal-session/route.ts`
- `app/api/stripe/cancel-subscription/route.ts`
- `app/api/stripe/webhooks/route.ts`
- `app/api/cron/sync-stripe-subscriptions/route.ts`

## Development Notes

- Run tests with `npm test` and coverage with `npm run test:coverage`. Follow the workspace convention (`Jest` + React Testing Library, one `*.test.ts`/`*.test.tsx` file per source file, co-located next to the source).
- Route and action parameters that map to Postgres UUID columns are validated with `assertUUID()` (`core/lib/assertUUID.ts`) at the action boundary before service/DAL calls.
- AI-heavy endpoints and interview services apply a per-user Arcjet token bucket (capacity 12, refill 4/day) in addition to middleware limits. Affected surfaces: `/api/ai/questions/generate-question`, `/api/ai/questions/generate-feedback`, `/api/ai/resumes/analyze`, and `createInterviewService` / `generateInterviewFeedbackService` in `core/features/interviews/service.ts`. Denied requests return `RATE_LIMIT_MESSAGE` (HTTP 429 for API routes; `ActionResult` for server actions) and surface via `errorToast`.
- Question feedback generation does not consume the questions plan limit; it only checks authentication and the per-user rate bucket. Plan limits apply when generating new questions.
- Resume uploads are validated in `core/features/resumeAnalysis/schemas.ts` (max 10MB; PDF, DOC, DOCX, or plain text). Validation failures return `FILE_SIZE_TOO_LARGE_MESSAGE` or `FILE_TYPE_NOT_SUPPORTED_MESSAGE`, which `errorToast` maps to friendly copy.
- Free-plan resume analysis limits are enforced atomically: `/api/ai/resumes/analyze` calls `reserveResumeAnalysisUsageService`, which uses `tryInsertResumeAnalysisDb` to lock the user row and insert within a transaction so concurrent requests cannot exceed the quota.
- Landing and upgrade plan cards pull copy from `core/features/billing/plans.ts` (`PUBLIC_PLANS`, `PRODUCT_FEATURES`); free-plan card limits are derived from `PLAN_LIMITS` in `core/data/constants.ts`. Cards use uniform styling (no "popular" badge); upgrade cards mark the user's current plan with a "Your plan" badge and show a payment-attention alert when a Stripe subscription exists but the plan is not `pro`.
- Stripe checkout flow: Checkout `success_url` hits `GET /api/stripe/checkout-return`, which fulfills via `fulfillCheckoutSession()` and redirects to `/app/upgrade?success=true&session_id=...`. Webhooks handle `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted` (`core/features/billing/stripeEventTypes.ts`). The upgrade success banner is verified read-only via `checkSubscriptionSuccess()` (Stripe session retrieve); DB writes happen in checkout-return and webhooks.
- Stripe webhook handling is explicitly idempotent via the `stripe_events` table and re-fetching subscription state from Stripe.
- A Vercel Cron job (`vercel.json`, schedule `0 12 * * *`) calls `/api/cron/sync-stripe-subscriptions` daily at 12:00 UTC to reconcile Stripe subscription state for users with missed webhooks. The route requires a `Bearer ${CRON_SECRET}` authorization header.
- `proxy.ts` skips Arcjet for all `/api/stripe/*` routes and applies Arcjet mainly to other `/api/**` traffic (shield, bot detection, 100 requests/minute sliding window). Stripe webhooks and `/api/cron/*` also skip session auth; webhooks use Stripe signatures and cron uses `Bearer ${CRON_SECRET}` in the route handler.
- Neon is a strong fit for Vercel deployments because it provides managed Postgres with straightforward hosted connection management (no containerized DB required in production).
