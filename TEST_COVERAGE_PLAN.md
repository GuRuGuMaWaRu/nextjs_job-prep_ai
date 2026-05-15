# Test Coverage Plan

This document records the planned direction for expanding test coverage so it
can be referenced across future implementation chats.

## Current Baseline

- Run `npm test` before starting coverage work and record the current pass/fail
  state in the relevant PR or issue.
- Use the existing `npm run test:coverage` script to generate coverage data.
- Treat the first coverage report as a baseline. Add conservative thresholds
  only after the initial gaps are understood.

## Coverage Priorities

1. Cover pure logic first.

   Start with fast, stable units that do not need framework or service mocks:

   - `core/lib/*`
   - `core/features/*/schemas.ts`
   - `formatters.ts`
   - Permission helpers such as:
     - `core/features/questions/permissions.ts`
     - `core/features/resumeAnalysis/permissions.ts`
     - `core/features/interviews/permissions.ts`

2. Add service-layer tests.

   Prioritize business logic and permission behavior in:

   - `core/features/jobInfos/service.ts`
   - `core/features/interviews/service.ts`
   - `core/features/questions/service.ts`

   Mock database and cache boundaries with the existing helpers in
   `core/test-utils/mocks/db.ts`.

3. Add server action tests.

   Cover validation, authorization, redirects, and success paths for:

   - `core/features/jobInfos/actions.ts`
   - `core/features/interviews/actions.ts`
   - `core/features/questions/actions.ts`
   - `core/features/users/actions.ts`

4. Add API route tests.

   The Stripe webhook route already has coverage. Expand next into:

   - Checkout route
   - Billing portal route
   - Cancel subscription route
   - Auth validate-session route
   - AI routes
   - Cron routes

   Keep all external services mocked at the module boundary, including Stripe,
   Google AI, Hume, Arcjet, and the database.

5. Add focused component tests.

   Prioritize user interaction and meaningful rendering behavior over broad
   snapshot coverage:

   - Auth forms
   - Job info form, card, and list components
   - Upgrade plan and billing action components
   - Resume, question, and interview client pages where user interaction matters

6. Add factories and mocks only when needed.

   Grow `core/test-utils` incrementally with the first test that needs each
   helper:

   - `jobInfo`, `interview`, and `question` factories
   - AI SDK mocks
   - Hume mocks
   - Arcjet mocks

## Recommended Starting Point

Start with a baseline `npm test` run and `npm run test:coverage`, then add
coverage for `core/lib`, schemas, formatters, and permission helpers. That path
should produce useful coverage quickly without fighting framework mocks.
