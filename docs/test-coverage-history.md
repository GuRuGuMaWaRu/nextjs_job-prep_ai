# Test Coverage Plan

This document records the planned direction for expanding test coverage so it
can be referenced across future implementation chats.

## Current Baseline

- Run `npm test` before starting coverage work and record the current pass/fail
  state in the relevant PR or issue.
- Use the existing `npm run test:coverage` script to generate coverage data.
- Before finalizing a coverage slice, run `npx.cmd biome format --write` on
  touched code files or `npm.cmd run check -- <files>` when appropriate, then
  run `npm.cmd run check:ci` so CI-only formatting failures are caught locally.
- Treat the first coverage report as a baseline. Add conservative thresholds
  only after the initial gaps are understood.

## Baseline Snapshot

Date: 2026-05-15

Commands run:

- `npm test`
- `npm run test:coverage`

Result:

- Initial `npm test` failed in PowerShell before Jest started because the
  unsigned `npm.ps1` shim is blocked by the local execution policy.
- After installing dependencies from `package-lock.json` with `npm.cmd ci`,
  `npm.cmd test` passed: 20 test suites, 130 tests, 0 snapshots.
- `npm.cmd run test:coverage` passed: 20 test suites, 130 tests, 0 snapshots.
- Initial coverage summary: 68.09% statements, 66.49% branches, 60.43%
  functions, and 71.83% lines.

Notable blockers and warnings:

- The repo had no `node_modules` directory at the start of the baseline run, so
  the first script execution through `npm.cmd` could not find `jest`.
- Jest emits repeated `baseline-browser-mapping` warnings that the local data is
  over two months old. This did not block test or coverage execution.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage baseline task.

Recommendation:

Start the next coverage slice with fast, low-mock targets in `core/lib`, route
metadata in `core/data/routes.ts`, and then the first permission or schema
helpers. Defer broad thresholds until these gaps are covered and the OAuth
modules are reviewed as a separate, mock-heavy slice.

## Progress Notes

### Pure Logic Slice - 2026-05-15

Files/tests added:

- `core/lib/assertUUID.test.ts`
- `core/lib/toSafeErrorMeta.test.ts`
- `core/lib/utils.test.ts`
- `core/data/routes.test.ts`
- `core/features/auth/schemas.test.ts`
- `core/features/jobInfos/schemas.test.ts`
- `core/features/jobInfos/lib/formatters.test.ts`
- `core/features/questions/formatters.test.ts`

Commands run:

- `npm.cmd ci`
- `npm.cmd test -- core/lib/assertUUID.test.ts core/lib/toSafeErrorMeta.test.ts core/lib/utils.test.ts core/data/routes.test.ts core/features/jobInfos/lib/formatters.test.ts core/features/questions/formatters.test.ts core/features/jobInfos/schemas.test.ts core/features/auth/schemas.test.ts`
- `npm test`
- `npm.cmd test`
- `npm run test:coverage`
- `npm.cmd run test:coverage`

Result:

- Focused slice passed: 8 test suites, 29 tests, 0 snapshots.
- `npm test` and `npm run test:coverage` still fail in PowerShell before Jest
  starts because the unsigned `npm.ps1` shim is blocked by the local execution
  policy.
- `npm.cmd test` passed: 28 test suites, 159 tests, 0 snapshots.
- `npm.cmd run test:coverage` passed: 28 test suites, 159 tests, 0 snapshots.
- Updated coverage summary: 69.57% statements, 66.18% branches, 65.33%
  functions, and 72.6% lines.

Notes:

- Jest continues to emit repeated `baseline-browser-mapping` warnings that the
  local data is over two months old. This did not block test or coverage
  execution.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage slice.

Recommendation:

Continue with the next low-mock slice by covering `core/features/auth/password.ts`
and lightweight permission behavior with module-level auth/user mocks. After
that, move into service-layer tests using the existing database mock helpers.

### Password and Permission Helpers Slice - 2026-05-15

Files/tests added:

- `core/features/auth/password.test.ts`
- `core/features/auth/permissions.test.ts`
- `core/features/questions/permissions.test.ts`
- `core/features/interviews/permissions.test.ts`
- `core/features/resumeAnalysis/permissions.test.ts`

Commands run:

- `npm.cmd ci`
- `npm.cmd test -- core/features/auth/password.test.ts core/features/auth/permissions.test.ts`
- `npm.cmd test -- core/features/auth/password.test.ts core/features/auth/permissions.test.ts core/features/questions/permissions.test.ts core/features/interviews/permissions.test.ts core/features/resumeAnalysis/permissions.test.ts`
- `npm test`
- `npm.cmd test`
- `npm run test:coverage`
- `npm.cmd run test:coverage`

Result:

- Initial focused run could not find `jest` because this worktree had no
  `node_modules`; `npm.cmd ci` installed dependencies from `package-lock.json`.
- Focused slice passed: 5 test suites, 26 tests, 0 snapshots.
- `npm test` and `npm run test:coverage` still fail in PowerShell before Jest
  starts because the unsigned `npm.ps1` shim is blocked by the local execution
  policy.
- `npm.cmd test` passed: 33 test suites, 185 tests, 0 snapshots.
- `npm.cmd run test:coverage` passed: 33 test suites, 185 tests, 0 snapshots.
- Updated coverage summary: 73.85% statements, 72.15% branches, 69.18%
  functions, and 76.9% lines.

Notes:

- Jest continues to emit repeated `baseline-browser-mapping` warnings that the
  local data is over two months old. This did not block test or coverage
  execution.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage slice.

Recommendation:

Move next into service-layer tests for `core/features/jobInfos/service.ts`,
`core/features/interviews/service.ts`, and `core/features/questions/service.ts`
using the existing database mock helpers. Keep API routes and OAuth base-flow
coverage as separate mock-heavy slices.

### Service Layer Slice - 2026-05-18

Files/tests added:

- `core/features/jobInfos/service.test.ts`
- `core/features/interviews/service.test.ts`
- `core/features/questions/service.test.ts`
- `core/features/jobInfos/serviceErrors.ts`
- `core/features/interviews/serviceErrors.ts`
- `core/test-utils/factories/jobInfo.ts`
- `core/test-utils/factories/interview.ts`
- `core/test-utils/factories/question.ts`

Commands run:

- `npm.cmd ci`
- `npm.cmd test -- core/features/jobInfos/service.test.ts core/features/interviews/service.test.ts core/features/questions/service.test.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`

Result:

- Focused service slice passed: 3 test suites, 25 tests, 0 snapshots.
- `npm.cmd test -- --runInBand` passed: 36 test suites, 210 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 36 test suites, 210
  tests, 0 snapshots.
- Updated coverage summary: 76.44% statements, 74.16% branches, 72.19%
  functions, and 79.04% lines.

Notes:

- Service-layer tests cover auth delegation, ownership checks, permission and
  not-found paths, DAL calls, and interview feedback generation behavior.
- New factories use safe synthetic identifiers and do not include real customer
  emails.
- Jest continues to emit the existing `baseline-browser-mapping` warning that
  the local data is over two months old.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage slice.

Recommendation:

Move next into server action tests for `core/features/jobInfos/actions.ts`,
`core/features/interviews/actions.ts`, `core/features/questions/actions.ts`, and
`core/features/users/actions.ts`. Keep API route coverage as the following
mock-heavy slice.

### Job Info Server Actions Slice - 2026-05-19

Files/tests added:

- `core/features/jobInfos/actionMessages.ts`
- `core/features/jobInfos/actions.test.ts`

Commands run:

- `npm.cmd ci`
- `npm.cmd test -- core/features/jobInfos/actions.test.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`

Result:

- Focused action slice passed: 1 test suite, 16 tests, 0 snapshots.
- `npm.cmd test -- --runInBand` passed: 37 test suites, 228 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 37 test suites, 228
  tests, 0 snapshots.
- Updated coverage summary: 78.14% statements, 75.69% branches, 73.84%
  functions, and 80.69% lines.
- `core/features/jobInfos/actions.ts` now reports 100% statements, branches,
  functions, and lines.

Notes:

- Action tests cover schema validation, successful create/update returns,
  mapped unauthorized/not-found/permission/database/unexpected errors, and thin
  read/remove service delegates.
- Jest continues to emit the existing `baseline-browser-mapping` warning that
  the local data is over two months old.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage slice.

Recommendation:

Continue the server action slice with `core/features/interviews/actions.ts`.
Add a shared Arcjet mock helper if the allow/deny protection scenarios create
duplication, then cover `core/features/questions/actions.ts` and
`core/features/users/actions.ts` before moving into API routes.

### Interview Server Actions Slice - 2026-05-19

Files/tests added:

- `core/features/interviews/actionMessages.ts`
- `core/features/interviews/actions.test.ts`

Files updated:

- `core/features/interviews/actions.ts`

Commands run:

- `npm.cmd ci`
- `npm.cmd test -- core/features/interviews/actions.test.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`

Result:

- Initial focused test run could not find `jest` because this worktree had no
  `node_modules`; `npm.cmd ci` installed dependencies from `package-lock.json`.
- Focused action slice passed: 1 test suite, 21 tests, 0 snapshots.
- `npm.cmd test -- --runInBand` passed: 38 test suites, 249 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 38 test suites, 249
  tests, 0 snapshots.
- Updated coverage summary: 78.2% statements, 75.15% branches, 73.89%
  functions, and 80.59% lines.
- `core/features/interviews/actions.ts` now reports 100% statements, branches,
  functions, and lines.

Notes:

- Action tests cover unauthenticated, plan-limit, Arcjet rate-limit,
  inaccessible job info, successful create, mapped create/update/feedback
  errors, and thin service/permission delegates.
- Interview action messages were extracted to a feature-local constants file to
  avoid duplicating production strings in tests.
- Jest continues to emit the existing `baseline-browser-mapping` warning that
  the local data is over two months old.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage slice.

Recommendation:

Continue the server action slice with `core/features/questions/actions.ts`,
then cover `core/features/users/actions.ts`. Keep API route coverage as the
following mock-heavy slice.

### User Action and Service Slice - 2026-05-19

Files/tests added:

- `core/features/users/actions.test.ts`
- `core/features/users/service.test.ts`

Files updated:

- `core/dal/errors.ts`
- `core/dal/helpers.ts`

Commands run:

- `npm.cmd ci`
- `npm.cmd test -- core/features/users/actions.test.ts core/features/users/service.test.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/users/actions.test.ts core/features/users/service.test.ts core/dal/errors.ts core/dal/helpers.ts core/features/users/service.ts core/features/jobInfos/actions.ts core/features/jobInfos/actions.test.ts core/features/jobInfos/dal.ts core/features/jobInfos/service.ts core/features/jobInfos/service.test.ts core/features/interviews/actions.ts core/features/interviews/actions.test.ts core/features/interviews/dal.ts core/features/interviews/service.ts core/features/interviews/service.test.ts core/features/auth/session.ts core/features/questions/dal.ts app/api/ai/resumes/analyze/route.ts app/api/ai/questions/generate-question/route.ts app/api/ai/questions/generate-feedback/route.ts TEST_COVERAGE_PLAN.md`

Result:

- Initial focused test run could not find `jest` because this worktree had no
  `node_modules`; `npm.cmd ci` installed dependencies from `package-lock.json`.
- Focused users slice passed: 2 test suites, 5 tests, 0 snapshots.
- `npm.cmd test -- --runInBand` passed: 42 test suites, 271 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 42 test suites, 271
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for touched code files.
- Updated coverage summary: 78.98% statements, 74.69% branches, 74.64%
  functions, and 81.22% lines.
- `core/features/users/actions.ts` and `core/features/users/service.ts` now
  report 100% statements, branches, functions, and lines.

Notes:

- Action tests cover service delegation and missing-user `null` propagation.
- Service tests cover successful lookup, missing user `null`, cache tagging,
  and database failures mapping to `DatabaseError`.
- Error classes now live in `core/dal/errors.ts`, allowing isolated service
  tests to import `DatabaseError` without widening the users service mock
  boundary.
- User fixtures use safe synthetic `@test.local` emails and no real customer
  emails.
- Jest continues to emit the existing `baseline-browser-mapping` warning that
  the local data is over two months old.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage slice.

Recommendation:

Move next into API route coverage, starting with the checkout, billing portal,
and cancel subscription routes. Keep external services mocked at module
boundaries, especially Stripe, auth, and database modules.

### Billing Stripe API Routes Slice - 2026-05-19

Files/tests added:

- `app/api/stripe/create-checkout-session/route.test.ts`
- `app/api/stripe/create-portal-session/route.test.ts`
- `app/api/stripe/cancel-subscription/route.test.ts`

Files updated:

- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- app/api/stripe/create-checkout-session/route.test.ts app/api/stripe/create-portal-session/route.test.ts app/api/stripe/cancel-subscription/route.test.ts --runInBand`
- `npm.cmd ci`
- `npm.cmd test -- app/api/stripe/create-checkout-session/route.test.ts app/api/stripe/create-portal-session/route.test.ts app/api/stripe/cancel-subscription/route.test.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/api/stripe/create-checkout-session/route.test.ts app/api/stripe/create-portal-session/route.test.ts app/api/stripe/cancel-subscription/route.test.ts TEST_COVERAGE_PLAN.md`

Result:

- Initial focused test run could not find `jest` because this worktree had no
  `node_modules`; `npm.cmd ci` installed dependencies from `package-lock.json`.
- Focused billing route slice passed: 3 test suites, 12 tests, 0 snapshots.
- `npm.cmd test -- --runInBand` passed: 45 test suites, 283 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 45 test suites, 283
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the three touched TypeScript test files.
  `TEST_COVERAGE_PLAN.md` was passed to the command but not checked by Biome.
- Updated coverage summary: 79.37% statements, 71.03% branches, 75.34%
  functions, and 81.37% lines.
- New route coverage:
  - `app/api/stripe/create-checkout-session/route.ts`: 73.91% statements,
    47.36% branches, 100% functions, 73.91% lines.
  - `app/api/stripe/create-portal-session/route.ts`: 89.28% statements,
    61.11% branches, 100% functions, 89.28% lines.
  - `app/api/stripe/cancel-subscription/route.ts`: 92.3% statements, 62.5%
    branches, 100% functions, 92.3% lines.

Notes:

- Route tests cover unauthenticated behavior, missing required user Stripe data,
  successful Stripe calls with idempotency options, and Stripe failure
  redirects.
- Stripe, auth, env, and billing helper modules are mocked at module
  boundaries; route handlers are exercised directly.
- Test user fixtures use safe synthetic `@test.local` emails and no real
  customer emails.
- Jest continues to emit the existing `baseline-browser-mapping` warning that
  the local data is over two months old.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage slice.

Recommendation:

Continue API route coverage with `app/api/auth/validate-session/route.ts`, then
move into the AI and cron routes. If Stripe route branch coverage becomes a
priority, add a small follow-up for configuration and fallback redirect
branches.

### Auth Validate Session API Route Slice - 2026-05-20

Files/tests added:

- `app/api/auth/validate-session/route.test.ts`

Files updated:

- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- app/api/auth/validate-session/route.test.ts --runInBand`
- `npm.cmd ci`
- `npm.cmd test -- app/api/auth/validate-session/route.test.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/api/auth/validate-session/route.test.ts TEST_COVERAGE_PLAN.md`

Result:

- Initial focused test run could not find `jest` because this worktree had no
  `node_modules`; `npm.cmd ci` installed dependencies from `package-lock.json`.
- Focused validate-session route slice passed: 1 test suite, 4 tests, 0
  snapshots.
- `npm.cmd test -- --runInBand` passed: 46 test suites, 287 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 46 test suites, 287
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `TEST_COVERAGE_PLAN.md` was passed to the command but not checked by Biome.
- Updated coverage summary: 79.65% statements, 71.32% branches, 75.46%
  functions, and 81.57% lines.
- New route coverage:
  - `app/api/auth/validate-session/route.ts`: 100% statements, 100% branches,
    100% functions, and 100% lines.

Notes:

- Route tests cover missing tokens, invalid tokens, valid sessions, redirect
  status/location shape, and invalid-session handling through the validation
  action boundary.
- Auth action and cookie helpers are mocked at module boundaries; the route
  handler is exercised directly with real `NextResponse.redirect` behavior.
- Test session fixtures use `TEST_USER_ID` and synthetic factory data.
- Jest continues to emit the existing `baseline-browser-mapping` warning that
  the local data is over two months old.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage slice.

Recommendation:

Continue API route coverage with the AI routes:
`app/api/ai/resumes/analyze/route.ts`,
`app/api/ai/questions/generate-question/route.ts`, and
`app/api/ai/questions/generate-feedback/route.ts`. Keep AI SDK, Arcjet, auth,
and database/service dependencies mocked at module boundaries.

### AI Generate Question API Route Slice - 2026-05-20

Files/tests added:

- `app/api/ai/questions/generate-question/route.test.ts`

Files updated:

- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- app/api/ai/questions/generate-question/route.test.ts --runInBand`
- `npm.cmd ci`
- `npm.cmd test -- app/api/ai/questions/generate-question/route.test.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/api/ai/questions/generate-question/route.test.ts TEST_COVERAGE_PLAN.md`

Result:

- Initial focused test run could not find `jest` because this worktree had no
  `node_modules`; `npm.cmd ci` installed dependencies from `package-lock.json`.
- Focused generate-question route slice passed: 1 test suite, 7 tests, 0
  snapshots.
- `npm.cmd test -- --runInBand` passed: 47 test suites, 294 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 47 test suites, 294
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `TEST_COVERAGE_PLAN.md` was passed to the command but not checked by Biome.
- Updated coverage summary: 80.19% statements, 71.93% branches, 75.79%
  functions, and 82% lines.
- New route coverage:
  - `app/api/ai/questions/generate-question/route.ts`: 95% statements, 87.5%
    branches, 100% functions, and 95% lines.

Notes:

- Route tests cover malformed request bodies, unauthenticated users, plan-limit
  denial, streamed success response setup, question insertion through the
  `onFinish` callback, unauthorized service errors, inaccessible job info, and
  database failures.
- Auth, permission, job info, question action, AI service, and AI SDK streaming
  modules are mocked at module boundaries; the route handler is exercised
  directly.
- Test fixtures use `TEST_USER_ID`, local factories, and synthetic question/job
  data only.
- Jest continues to emit the existing `baseline-browser-mapping` warning that
  the local data is over two months old.
- `npm.cmd ci` reported existing dependency audit findings. They were not part
  of this coverage slice.

Recommendation:

Continue the AI API route slice with
`app/api/ai/questions/generate-feedback/route.ts`, then cover
`app/api/ai/resumes/analyze/route.ts`. Keep AI SDK stream responses, auth/action
boundaries, and feature permissions mocked at module boundaries.

### AI Generate Feedback API Route Slice - 2026-05-21

Files/tests added:

- `app/api/ai/questions/generate-feedback/route.test.ts`

Files updated:

- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- app/api/ai/questions/generate-feedback/route.test.ts --runInBand`
- `npm.cmd install`
- `npm.cmd test -- app/api/ai/questions/generate-feedback/route.test.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/api/ai/questions/generate-feedback/route.test.ts TEST_COVERAGE_PLAN.md`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`

Result:

- Initial focused test run could not find `jest` because this worktree had no
  `node_modules`; `npm.cmd install` installed dependencies from
  `package-lock.json`.
- Focused generate-feedback route slice passed: 1 test suite, 6 tests, 0
  snapshots.
- `npm.cmd test -- --runInBand` passed: 48 test suites, 300 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 48 test suites, 300
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `TEST_COVERAGE_PLAN.md` was passed to the command but not checked by Biome.
- Updated coverage summary: 80.53% statements, 72.45% branches, 75.9%
  functions, and 82.32% lines.
- New route coverage:
  - `app/api/ai/questions/generate-feedback/route.ts`: 100% statements, 100%
    branches, 100% functions, and 100% lines.

Notes:

- Route tests cover invalid request bodies, missing questions, streamed success
  responses, unauthorized action failures, database action failures, and
  unexpected AI service failures.
- Question action and AI feedback service modules are mocked at module
  boundaries; DAL error classes are imported as real classes to exercise the
  route's `instanceof` handling.
- Test fixtures use `TEST_USER_ID`, local factories, and synthetic question
  data only.
- Jest continues to emit the existing `baseline-browser-mapping` warning that
  the local data is over two months old.
- `npm.cmd install` reported existing dependency audit findings. They were not
  part of this coverage slice.

Recommendation:

Continue AI API route coverage with `app/api/ai/resumes/analyze/route.ts`. Keep
AI/model behavior mocked through the service boundary where possible, and mock
auth, permission, and database/action dependencies at module boundaries.

### AI Resume Analyze API Route Slice - 2026-05-21

Files/tests added:

- `app/api/ai/resumes/analyze/route.test.ts`

Files updated:

- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- app/api/ai/resumes/analyze/route.test.ts --runInBand`
- `npm.cmd install`
- `npm.cmd test -- app/api/ai/resumes/analyze/route.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/api/ai/resumes/analyze/route.test.ts TEST_COVERAGE_PLAN.md`
- `npm.cmd run test:coverage -- --runInBand`

Result:

- Initial focused test run could not find `jest` because this worktree had no
  `node_modules`; `npm.cmd install` installed dependencies from
  `package-lock.json`.
- Focused resume-analyze route slice passed: 1 test suite, 9 tests, 0
  snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 49 test suites, 309 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 49 test suites, 309
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `TEST_COVERAGE_PLAN.md` was passed to the command but not checked by Biome.
- Updated coverage summary: 81.08% statements, 73.09% branches, 76.23%
  functions, and 82.9% lines.
- New route coverage:
  - `app/api/ai/resumes/analyze/route.ts`: 100% statements, 92.85%
    branches, 100% functions, and 100% lines.

Notes:

- Route tests cover invalid multipart form data, unauthenticated users,
  inaccessible job info, plan-limit denial, streamed success responses,
  not-found and permission action failures, database action failures, and
  unexpected AI service failures.
- Auth, job info action, resume-analysis permission, and resume AI service
  modules are mocked at module boundaries; DAL error classes are imported as
  real classes to exercise the route's `instanceof` handling.
- Test fixtures use `TEST_USER_ID`, local factories, and synthetic resume/job
  data only.
- Jest continues to emit the existing `baseline-browser-mapping` warning that
  the local data is over two months old.
- `npm.cmd install` reported existing dependency audit findings. They were not
  part of this coverage slice.

Recommendation:

Continue API route coverage with the remaining cron and OAuth routes, starting
with the smallest cron handlers before moving into the more mock-heavy OAuth
provider route.

### Cron Stripe Sync Route Slice - 2026-05-21

Files/tests added:

- `app/api/cron/sync-stripe-subscriptions/route.test.ts`

Files updated:

- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- app/api/cron/sync-stripe-subscriptions/route.test.ts --runInBand`
- `npm test`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/api/cron/sync-stripe-subscriptions/route.test.ts TEST_COVERAGE_PLAN.md`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`

Result:

- Initial focused test run could not find `jest` because this worktree had no
  `node_modules`; `npm.cmd install` installed dependencies from
  `package-lock.json`.
- Focused cron route slice passed: 1 test suite, 8 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 50 test suites, 317 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 50 test suites, 317
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `TEST_COVERAGE_PLAN.md` was passed to the command but not checked by Biome.
- Updated coverage summary: 81.78% statements, 74.14% branches, 76.54%
  functions, and 83.55% lines.
- New route coverage:
  - `app/api/cron/sync-stripe-subscriptions/route.ts`: 100% statements, 95.45%
    branches, 100% functions, and 100% lines.

Notes:

- Route tests cover missing and invalid cron authorization, Stripe
  configuration failures, missing Stripe client, successful reconciliation
  counters, handled service error results, rejected per-user reconciliation
  failures, error sample limiting, and unexpected candidate lookup failures.
- Stripe/client helpers, user DB lookup, and Stripe sync service boundaries are
  mocked at module boundaries.
- Test fixtures use `TEST_USER_ID`, `TEST_OTHER_USER_ID`, and synthetic user ids
  only.
- `app/api/cron/hello/route.ts` was recommended as a target but is not present
  in this worktree; only `app/api/cron/sync-stripe-subscriptions/route.ts`
  exists under `app/api/cron`.
- Jest no longer emitted the earlier `baseline-browser-mapping` warning during
  this slice.
- `npm.cmd install` reported existing dependency audit findings. They were not
  part of this coverage slice.

Recommendation:

Continue API route coverage with `app/api/oauth/[provider]/route.ts`, or deepen
remaining Stripe branch coverage in the checkout, portal, and cancel routes if
keeping the slice billing-focused.

### OAuth Provider Callback Route Slice - 2026-05-22

Files/tests added:

- `app/api/oauth/[provider]/route.test.ts`

Files updated:

- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- --runTestsByPath app/api/oauth/[provider]/route.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/api/oauth/[provider]/route.test.ts TEST_COVERAGE_PLAN.md`

Result:

- Focused OAuth route slice passed: 1 test suite, 10 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 51 test suites, 327 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 51 test suites, 327
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `TEST_COVERAGE_PLAN.md` was passed to the command but not checked by Biome.
- Updated coverage summary: 82.57% statements, 74.89% branches, 77.19%
  functions, and 84.34% lines.
- New route coverage:
  - `app/api/oauth/[provider]/route.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.

Notes:

- Route tests cover unsupported providers, missing callback `code` / `state`,
  unconfigured providers, successful OAuth account connection, session and
  cookie side effects, known OAuth email error redirects, unexpected callback
  failures, and stored error-return paths.
- OAuth client/config, account connection, session, cookie, and Next redirect
  boundaries are mocked at module boundaries; the route handler is exercised
  directly.
- Test fixtures use `TEST_USER_ID` and synthetic `@test.local` OAuth email data
  only.
- Jest did not emit the earlier `baseline-browser-mapping` warning during this
  slice.

Recommendation:

Deepen the remaining Stripe API branch coverage in
`app/api/stripe/create-checkout-session/route.ts`,
`app/api/stripe/create-portal-session/route.ts`, and
`app/api/stripe/cancel-subscription/route.ts`; after that, move into focused
component tests for auth and billing flows.

### Stripe API Branch Coverage Slice - 2026-05-22

Files/tests updated:

- `app/api/stripe/create-checkout-session/route.test.ts`
- `app/api/stripe/create-portal-session/route.test.ts`
- `app/api/stripe/cancel-subscription/route.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- app/api/stripe/create-checkout-session/route.test.ts app/api/stripe/create-portal-session/route.test.ts app/api/stripe/cancel-subscription/route.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/api/stripe/create-checkout-session/route.test.ts app/api/stripe/create-portal-session/route.test.ts app/api/stripe/cancel-subscription/route.test.ts TEST_COVERAGE_PLAN.md`

Result:

- Focused Stripe route slice passed: 3 test suites, 29 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 51 test suites, 344 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 51 test suites, 344
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the three touched TypeScript test files.
  `TEST_COVERAGE_PLAN.md` was passed to the command but not checked by Biome.
- Updated coverage summary: 83.71% statements, 81.74% branches, 77.19%
  functions, and 85.55% lines.
- Updated route coverage:
  - `app/api/stripe/create-checkout-session/route.ts`: 100% statements, 100%
    branches, 100% functions, and 100% lines.
  - `app/api/stripe/create-portal-session/route.ts`: 100% statements, 100%
    branches, 100% functions, and 100% lines.
  - `app/api/stripe/cancel-subscription/route.ts`: 100% statements, 100%
    branches, 100% functions, and 100% lines.

Notes:

- Added focused branch coverage for Stripe configuration failures, missing
  Stripe clients, checkout price fallback/config failures, already-Pro and
  existing-subscription redirects, customer email fallback, missing Stripe
  session URLs, non-JSON 302 redirects, request-origin base URL fallback, and
  omitted idempotency options.
- Stripe, auth, env, and billing helper modules remain mocked at module
  boundaries; route handlers are exercised directly.
- Test user fixtures use `TEST_USER_ID` and synthetic `@test.local` billing
  emails only.

Recommendation:

Move next into focused component tests for auth and billing flows, or into
OAuth service internals if improving the lowest remaining coverage areas is the
priority.

### Auth OAuth Components Slice - 2026-05-22

Files/tests added:

- `core/features/auth/components/OAuthQueryErrorBanner.test.tsx`
- `core/features/auth/components/OAuthSignInSection.test.tsx`

Files updated:

- `AGENTS.md`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/auth/components/OAuthQueryErrorBanner.test.tsx core/features/auth/components/OAuthSignInSection.test.tsx --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/auth/components/OAuthQueryErrorBanner.test.tsx core/features/auth/components/OAuthSignInSection.test.tsx AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused auth component slice passed: 2 test suites, 6 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 54 test suites, 354 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 54 test suites, 354
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the two touched TypeScript test files.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 83.22% statements, 79.31% branches, 78.45%
  functions, and 84.97% lines.
- New component coverage:
  - `core/features/auth/components/OAuthQueryErrorBanner.tsx`: 100%
    statements, 100% branches, 100% functions, and 100% lines.
  - `core/features/auth/components/OAuthSignInSection.tsx`: 88.23%
    statements, 90% branches, 87.5% functions, and 88.23% lines.

Notes:

- Component tests cover empty OAuth states, mapped OAuth query errors, form
  error precedence, configured provider rendering, last-used provider labeling,
  and OAuth action invocation with the sign-up error-return target.
- Next navigation and auth action dependencies are mocked at module boundaries.
- `AGENTS.md` now documents the local convention to place module-level
  `jest.mock(...)` calls before imports when mocking imported modules.
- No user email fixtures were needed for this slice.
- This worktree is currently based on merged `main`; the recorded coverage
  summary reflects the local post-merge state at verification time.

Recommendation:

Continue focused auth component coverage with `SignInForm` and `SignUpForm`,
mocking only `useActionState`/action boundaries as needed. If lowest remaining
coverage is the priority, move into `core/features/auth/oauth/base.ts` and the
cookie helpers in `oauthErrorReturn.ts` / `oauthLastUsed.ts`.

### Auth Form Components Slice - 2026-05-22

Files/tests added:

- `core/features/auth/components/SignInForm.test.tsx`
- `core/features/auth/components/SignUpForm.test.tsx`

Files updated:

- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/auth/components/SignInForm.test.tsx --runInBand`
- `npm.cmd test -- core/features/auth/components/SignUpForm.test.tsx --runInBand`
- `npm.cmd test -- core/features/auth/components/SignInForm.test.tsx core/features/auth/components/SignUpForm.test.tsx --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/auth/components/SignInForm.test.tsx core/features/auth/components/SignUpForm.test.tsx AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused auth form slice passed: 2 test suites, 6 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 56 test suites, 360 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 56 test suites, 360
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the two touched TypeScript test files.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 83.5% statements, 79.29% branches, 78.07%
  functions, and 85.26% lines.
- New component coverage:
  - `core/features/auth/components/SignInForm.tsx`: 100% statements, 100%
    branches, 100% functions, and 100% lines.
  - `core/features/auth/components/SignUpForm.tsx`: 100% statements, 100%
    branches, 100% functions, and 100% lines.

Notes:

- Component tests cover default field rendering, action-state wiring, OAuth
  child component props, preserved invalid field values, field error rendering,
  form error banner handoff, pending button copy, and disabled pending controls.
- React `useActionState`, auth action modules, and OAuth child components are
  mocked at module boundaries with module-level `jest.mock(...)` calls before
  imports.
- Test email fixtures use synthetic `@test.local` addresses only.
- The first SignInForm focused run failed because `CardTitle` is a styled `div`,
  not a semantic heading; the assertion was updated to verify stable visible
  copy instead.

Recommendation:

Move next into the lowest remaining auth coverage areas:
`core/features/auth/oauth/base.ts` and the cookie helpers in
`oauthErrorReturn.ts` / `oauthLastUsed.ts`. Keep provider/client behavior mocked
at module boundaries and cover cookie read/write/delete branches in a small
focused slice.

## Slice: Auth OAuth Cookie Helpers

Branch suggestion: `test/auth-oauth-cookie-helpers`

PR title suggestion: `test(auth): cover OAuth cookie helpers`

Files added/updated:

- `core/features/auth/oauth/oauthErrorReturn.test.ts`
- `core/features/auth/oauth/oauthLastUsed.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/auth/oauth/oauthErrorReturn.test.ts core/features/auth/oauth/oauthLastUsed.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/auth/oauth/oauthErrorReturn.test.ts core/features/auth/oauth/oauthLastUsed.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused OAuth helper slice passed after tightening the expected shared cookie
  options: 2 test suites, 15 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 58 test suites, 382 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed after rerunning with
  permission to write Jest's Windows temp cache: 58 test suites, 382 tests, 0
  snapshots.
- `npx.cmd tsc --noEmit` fails on an existing unrelated type issue in
  `core/features/users/stripeSync.test.ts`: `[Symbol.asyncIterator]` is not a
  known property on `ApiList<Subscription>`.
- Focused `biome lint` passed for the two touched TypeScript test files.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 83.92% statements, 78.19% branches, 78.81%
  functions, and 85.52% lines.
- Updated auth OAuth cookie helper coverage:
  - `core/features/auth/oauth/oauthErrorReturn.ts`: 100% statements, 100%
    branches, 100% functions, and 100% lines.
  - `core/features/auth/oauth/oauthLastUsed.ts`: 100% statements, 100%
    branches, 100% functions, and 100% lines.

Notes:

- Tests now cover setting, reading, defaulting, and deleting the OAuth
  error-return cookie through the async `next/headers` cookie store.
- Tests now cover setting and reading the last-used OAuth provider cookie,
  including missing and invalid values.
- `next/headers` is mocked at the module boundary with module-level
  `jest.mock(...)` calls before imports.
- The first focused run failed because `oauthLastUsed.ts` intentionally spreads
  the shared auth `COOKIE_OPTIONS`, which include `secure: false` in the test
  environment and `path: "/"`; the test now asserts that shared contract.

Recommendation:

Move next into `core/features/auth/oauth/base.ts`, focusing on `OAuthClient`
state/code-verifier cookie behavior and token/user error branches. Keep
provider-specific clients mocked or use a small local `OAuthClient` fixture with
mocked `fetch`.

## Slice: Auth OAuth Base Client

Branch suggestion: `test/auth-oauth-base-client`

PR title suggestion: `test(auth): cover OAuth base client`

Files added/updated:

- `core/features/auth/oauth/base.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/auth/oauth/base.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/auth/oauth/base.test.ts TEST_COVERAGE_PLAN.md`

Result:

- Focused OAuth base client slice passed: 1 test suite, 13 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 59 test suites, 395 tests, 0
  snapshots.
- Initial `npm.cmd run test:coverage -- --runInBand` failed with `EPERM`
  writing Jest's Windows temp haste-map cache; rerunning with permission to
  write that cache passed: 59 test suites, 395 tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `TEST_COVERAGE_PLAN.md` was passed to the command but not checked by Biome.
- Updated coverage summary: 90.12% statements, 83.17% branches, 85.13%
  functions, and 92.06% lines.
- Updated auth OAuth base coverage:
  - `core/features/auth/oauth/base.ts`: 97.8% statements, 92.85% branches,
    100% functions, and 97.8% lines.

Notes:

- Tests now cover `OAuthClient.createAuthUrl` state and code-verifier cookie
  writes, redirect URL construction, scope joining, and PKCE challenge params.
- Tests now cover `fetchUser` invalid-state and missing-code-verifier branches,
  token exchange request body/header shape, parser-based user mapping,
  resolver-based user mapping, token HTTP/schema failures, user HTTP/schema
  failures, and unexpected token/user failure wrapping.
- Tests also cover the `getOAuthClient` dispatcher for unconfigured providers
  and the configured Discord, GitHub, and Google factory boundaries.
- OAuth provider factories, OAuth config, server env, fetch, and cookies are
  mocked at module boundaries. Test user data uses only synthetic
  `@test.local` email values.

Recommendation:

Continue the OAuth internals slice with provider-specific client gaps in
`core/features/auth/oauth/github.ts`, `google.ts`, and `discord.ts`, keeping
network behavior mocked through `OAuthClient` or direct resolver helpers.

## Slice: Auth OAuth GitHub Provider

Branch suggestion: `test/auth-oauth-github-provider`

PR title suggestion: `test(auth): cover GitHub OAuth resolver`

Files added/updated:

- `core/features/auth/oauth/github.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/auth/oauth/github.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/auth/oauth/github.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused GitHub OAuth provider slice passed: 1 test suite, 8 tests, 0
  snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 59 test suites, 399 tests, 0
  snapshots.
- Initial `npm.cmd run test:coverage -- --runInBand` failed with `EPERM`
  writing Jest's Windows temp haste-map cache; rerunning with permission to
  write that cache passed: 59 test suites, 399 tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 91.01% statements, 84.42% branches, 85.92%
  functions, and 92.99% lines.
- Updated auth OAuth provider coverage:
  - `core/features/auth/oauth/github.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.
  - `core/features/auth/oauth/base.ts`: 97.91% statements, 92.85% branches,
    100% functions, and 97.91% lines.
  - `core/features/auth/oauth/google.ts`: 62.5% statements, 100% branches, 50%
    functions, and 71.42% lines.
  - `core/features/auth/oauth/discord.ts`: 78.57% statements, 100% branches,
    50% functions, and 76.92% lines.

Notes:

- Added resolver-path tests for GitHub's secondary `/user/emails` request,
  covering verified email success, invalid email payload wrapping, no verified
  email handling, and email endpoint fetch failures.
- Tests exercise the real `createGithubOAuthClient` through
  `OAuthClient.fetchUser` while mocking only `fetch` and using a local cookie
  store fixture.
- Test email fixtures use synthetic `@test.local` addresses only.

Recommendation:

Continue the provider internals slice with small factory/client coverage for
`core/features/auth/oauth/google.ts` and `core/features/auth/oauth/discord.ts`.
Target client creation behavior through `OAuthClient.fetchUser` or
`createAuthUrl`, keeping base client branches out of scope unless a provider
specific gap requires them.

### OAuth Google and Discord Factory Slice - 2026-05-26

Files/tests updated:

- `core/features/auth/oauth/google.test.ts`
- `core/features/auth/oauth/discord.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/auth/oauth/google.test.ts core/features/auth/oauth/discord.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/auth/oauth/google.test.ts core/features/auth/oauth/discord.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused Google/Discord OAuth provider slice passed: 2 test suites, 18 tests,
  0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 59 test suites, 403 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 59 test suites, 403
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test files.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 91.29% statements, 84.42% branches, 87.03%
  functions, and 93.29% lines.
- Updated auth OAuth provider coverage:
  - `core/features/auth/oauth/google.ts`: 87.5% statements, 100% branches,
    100% functions, and 100% lines.
  - `core/features/auth/oauth/discord.ts`: 100% statements, 100% branches,
    100% functions, and 100% lines.
  - `core/features/auth/oauth/github.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.
  - `core/features/auth/oauth/base.ts`: 97.91% statements, 92.85% branches,
    100% functions, and 97.91% lines.

Notes:

- Added provider-factory coverage through the real Google and Discord OAuth
  clients using `createAuthUrl` and `OAuthClient.fetchUser`.
- Tests mock only `fetch` and assert provider-specific auth URLs, scopes, user
  endpoints, user mapping, and callback cookie cleanup.
- Updated Discord test email fixtures to synthetic `@test.local` addresses.
- The known Windows temp-cache permission retry was not needed in this
  coverage run.

Recommendation:

Continue with a small OAuth config/client edge slice if useful, especially
`core/features/auth/oauth/config.ts`, or move back to the broader plan with
`core/features/billing/webhookHelpers.ts` and `core/lib/errorToast.tsx`.

### OAuth Config Edge Slice - 2026-05-26

Files/tests updated:

- `core/features/auth/oauth/config.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/auth/oauth/config.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/auth/oauth/config.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused OAuth config slice passed: 1 test suite, 10 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 59 test suites, 406 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 59 test suites, 406
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 91.47% statements, 84.68% branches, 87.4%
  functions, and 93.47% lines.
- Updated auth OAuth config coverage:
  - `core/features/auth/oauth/config.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.
- Related auth OAuth coverage:
  - `core/features/auth/oauth/base.ts`: 97.91% statements, 92.85% branches,
    100% functions, and 97.91% lines.
  - `core/features/auth/oauth/google.ts`: 87.5% statements, 100% branches,
    100% functions, and 100% lines.
  - `core/features/auth/oauth/discord.ts`: 100% statements, 100% branches,
    100% functions, and 100% lines.
  - `core/features/auth/oauth/github.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.

Notes:

- Added focused coverage for Discord and GitHub credential resolution, blank
  secret handling, provider filtering with incomplete credentials, and the
  runtime unsupported-provider guard.
- The known unsigned `npm.ps1` PowerShell blocker remains the only verification
  issue; the working `.cmd` test, coverage, type-check, and lint paths passed.
- No user email fixtures were needed for this slice.

Recommendation:

Move next to the broader uncovered areas:
`core/features/billing/webhookHelpers.ts` and `core/lib/errorToast.tsx`. Start
with `webhookHelpers.ts` if branch coverage is the priority, or
`errorToast.tsx` for a small UI utility slice.

## Slice: Billing Webhook Helpers - 2026-05-26

Files added/updated:

- `core/features/billing/webhookHelpers.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/billing/webhookHelpers.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/billing/webhookHelpers.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused billing helper slice passed: 1 test suite, 20 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 59 test suites, 424 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 59 test suites, 424
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 93.64% statements, 88.75% branches, 89.25%
  functions, and 95.65% lines.
- Updated billing helper coverage:
  - `core/features/billing/webhookHelpers.ts`: 100% statements, 97.5%
    branches, 100% functions, and 100% lines.
- Related billing coverage:
  - `core/features/billing/stripeEventTypes.ts`: 100% statements, 100%
    branches, 100% functions, and 100% lines.

Notes:

- Added focused coverage for processed-event marking, remediation marking with
  512-character detail truncation, missing remediation-column rollout fallback,
  unexpected remediation write failures, non-`Error` remediation failure
  handling, first-writer event claiming, duplicate processed/remediation/
  processing states, repeatedly missing claim rows, and unclaim deletion.
- Added checkout fulfillment branch coverage for unpaid sessions, missing
  `metadata.userId`, incomplete customer/subscription payloads, missing Stripe
  client, expanded checkout customer/subscription object IDs, `trialing`
  subscription status, and mismatched subscription customers.
- The known unsigned `npm.ps1` PowerShell blocker remains the only verification
  issue; the working `.cmd` test, coverage, type-check, and lint paths passed.
- No customer email fixtures were used in this slice.

Recommendation:

Move to `core/lib/errorToast.tsx` for the next small, high-gap utility slice.
Focus on error message selection and toast invocation behavior while mocking
only the toast boundary.

### Error Toast Utility Slice - 2026-05-26

Files/tests added or updated:

- `core/lib/errorToast.test.tsx`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/lib/errorToast.test.tsx --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/lib/errorToast.test.tsx AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused error toast slice passed: 1 test suite, 6 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 60 test suites, 430 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 60 test suites, 430
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed after narrowing the toast action to a React
  element before rendering it in the test.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 94.73% statements, 90.31% branches, 90%
  functions, and 96.73% lines.
- Updated error toast coverage:
  - `core/lib/errorToast.tsx`: 100% statements, 100% branches, 100% functions,
    and 100% lines.
- Updated `core/lib` aggregate coverage: 100% statements, 100% branches, 100%
  functions, and 100% lines.

Notes:

- Added focused coverage for plan-limit upgrade action rendering and toast
  dismissal, rate-limit messaging, Hume-unavailable messaging, file-size and
  file-type upload errors, and fallback raw-message toasts.
- Mocked only the `sonner` toast boundary; the plan-limit action renders the
  real `Button`/`Link` composition and verifies the upgrade route.
- The known unsigned `npm.ps1` PowerShell blocker remains the only verification
  issue; the working `.cmd` test, coverage, type-check, and lint paths passed.
- No customer email fixtures were used in this slice.

Recommendation:

Move next to `app/app/upgrade/syncSubscriptionOnLoad.ts` or another compact
upgrade/billing utility with uncovered branches. Keep the slice focused on
observable return behavior and mocked module boundaries.

### Upgrade Subscription Sync Slice - 2026-05-26

Files/tests added or updated:

- `app/app/upgrade/syncSubscriptionOnLoad.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npx.cmd jest app/app/upgrade/syncSubscriptionOnLoad.test.ts --coverage --collectCoverageFrom=app/app/upgrade/syncSubscriptionOnLoad.ts --runInBand`
- `npm test`
- `npm.cmd test -- app/app/upgrade/syncSubscriptionOnLoad.test.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/app/upgrade/syncSubscriptionOnLoad.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused coverage probe passed: 1 test suite, 7 tests, 0 snapshots.
- Focused upgrade sync Jest passed: 1 test suite, 7 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 60 test suites, 434 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 60 test suites, 434
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 94.96% statements, 90.93% branches, 90%
  functions, and 96.98% lines.
- Updated upgrade sync coverage:
  - `app/app/upgrade/syncSubscriptionOnLoad.ts`: 100% statements, 100%
    branches, 100% functions, and 100% lines.
- Updated `app/app/upgrade` aggregate coverage: 97.29% statements, 90.47%
  branches, 100% functions, and 97.22% lines.

Notes:

- Added focused early-return coverage for Stripe not configured, configured
  Stripe client unavailable, no signed-in user, and users without a Stripe
  subscription id.
- Kept mocking at module boundaries for auth, Stripe configuration, user DB
  lookup, and subscription reconciliation.
- The known unsigned `npm.ps1` PowerShell blocker remains the only verification
  issue; the working `.cmd` test, coverage, type-check, and lint paths passed.
- No customer email fixtures were used in this slice.

Recommendation:

Move next to `app/app/upgrade/checkSubscriptionSuccess.ts` to cover the final
fallback branch when `success=true` but `session_id` is missing or Stripe is
unavailable. Keep the slice narrow around observable `false` returns and
downstream calls not firing.

### Upgrade Checkout Success Fallback Slice - 2026-05-27

Files/tests updated:

- `app/app/upgrade/checkSubscriptionSuccess.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npx.cmd jest app/app/upgrade/checkSubscriptionSuccess.test.ts --coverage --collectCoverageFrom=app/app/upgrade/checkSubscriptionSuccess.ts --runInBand`
- `npm.cmd test -- app/app/upgrade/checkSubscriptionSuccess.test.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/app/upgrade/checkSubscriptionSuccess.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused checkout success coverage probe passed: 1 test suite, 8 tests, 0
  snapshots.
- Focused checkout success Jest passed: 1 test suite, 8 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `C:\nvm4w\nodejs\npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 60 test suites, 436 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 60 test suites, 436
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 95.02% statements, 91.25% branches, 90%
  functions, and 97.04% lines.
- Updated upgrade checkout success coverage:
  - `app/app/upgrade/checkSubscriptionSuccess.ts`: 100% statements, 100%
    branches, 100% functions, and 100% lines.
- Updated `app/app/upgrade` aggregate coverage: 100% statements, 100%
  branches, 100% functions, and 100% lines.

Notes:

- Added focused fallback coverage for `success=true` when `session_id` is
  missing, when `session_id` is not a string, and when Stripe is unavailable.
- Assertions verify the helper returns `false` and does not call auth, Checkout
  session retrieval, or fallback fulfillment when the required Stripe session
  preconditions are not met.
- The known unsigned `npm.ps1` PowerShell blocker remains the only verification
  issue; the working `.cmd` test, coverage, type-check, and lint paths passed.
- No customer email fixtures were used in this slice.

Recommendation:

Move next to `core/features/users/stripeSync.ts` for a focused branch-coverage
slice. The fresh coverage report shows it at 82.14% statements and 68.57%
branches, with gaps around Stripe subscription/customer fallback handling and
error paths.

### User Stripe Sync Branch Coverage Slice - 2026-05-27

Files/tests updated:

- `core/features/users/stripeSync.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/users/stripeSync.test.ts --runInBand`
- `npx.cmd jest core/features/users/stripeSync.test.ts --coverage --collectCoverageFrom=core/features/users/stripeSync.ts --runInBand`
- `npm test`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/users/stripeSync.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused user Stripe sync Jest passed: 1 test suite, 28 tests, 0 snapshots.
- Focused coverage probe passed: 1 test suite, 28 tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `C:\nvm4w\nodejs\npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd test -- --runInBand` passed: 60 test suites, 454 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 60 test suites, 454
  tests, 0 snapshots.
- Initial `npx.cmd tsc --noEmit` surfaced two test mock typings for intentional
  `null` DB results; after narrowing those fixtures, `npx.cmd tsc --noEmit`
  passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 95.87% statements, 94.68% branches, 90%
  functions, and 97.94% lines.
- Updated users coverage:
  - `core/features/users/stripeSync.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.
  - `core/features/users` aggregate: 100% statements, 100% branches, 100%
    functions, and 100% lines.

Notes:

- Added branch coverage for stale webhook null-active context, active/trialing
  direct sync, inactive replacement selection, missing-user retry behavior,
  missing or mismatched Stripe customers, expanded customer objects, unchanged
  reconciliation, concurrent row-guard warnings, missing-subscription repair
  and downgrade fallbacks, and unexpected Stripe retrieval failures.
- Kept mocks at the Stripe and user DB module boundaries; no production code
  changed.
- Test fixtures use synthetic ids and no customer email fixtures.
- The known unsigned `npm.ps1` PowerShell blocker remains the only verification
  issue; the working `.cmd` test, coverage, type-check, and lint paths passed.

Recommendation:

Move next to a compact remaining branch gap such as
`app/api/stripe/webhooks/route.ts` or `core/features/auth/oauth/base.ts`. If
the goal is smaller and lower-risk, cover `core/dal/helpers.ts` or the remaining
permission helper branches first.

### Stripe Webhook Route Branch Slice - 2026-05-27

Files/tests updated:

- `app/api/stripe/webhooks/route.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npx.cmd jest app/api/stripe/webhooks/route.test.ts --coverage --collectCoverageFrom=app/api/stripe/webhooks/route.ts --runInBand`
- `npm.cmd test -- app/api/stripe/webhooks/route.test.ts --runInBand`
- `npx.cmd biome format --write app/api/stripe/webhooks/route.test.ts`
- `npm test`
- `npm.cmd run check:ci`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- app/api/stripe/webhooks/route.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Initial focused webhook coverage probe passed: 1 test suite, 19 tests, 0
  snapshots, with `app/api/stripe/webhooks/route.ts` at 98.43% statements,
  86.66% branches, 100% functions, and 100% lines.
- Focused webhook Jest passed after the new cases: 1 test suite, 23 tests, 0
  snapshots.
- Focused webhook coverage probe passed after the new cases: 1 test suite, 23
  tests, 0 snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `C:\nvm4w\nodejs\npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd run check:ci` passed.
- `npm.cmd test -- --runInBand` passed before pulling `main`: 60 test suites,
  440 tests, 0 snapshots.
- After pulling `main`, `npm.cmd test -- --runInBand` passed: 60 test suites,
  458 tests, 0 snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed before pulling `main`: 60
  test suites, 440 tests, 0 snapshots.
- After pulling `main`, `npm.cmd run test:coverage -- --runInBand` passed: 60
  test suites, 458 tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Final coverage summary after pulling `main`: 95.93% statements, 95.31%
  branches, 90% functions, and 97.94% lines.
- Updated webhook route coverage:
  - `app/api/stripe/webhooks/route.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.
- Confirmed pulled user Stripe sync coverage:
  - `core/features/users/stripeSync.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.
  - `core/features/users` aggregate: 100% statements, 100% branches, 100%
    functions, and 100% lines.

Notes:

- Added focused branch coverage for `customer.subscription.deleted` with an
  expanded customer object and with no resolvable customer id.
- Added failure-recovery coverage for non-`Error` unclaim failures and
  non-`Error` remediation-write failures, including safe alert metadata.
- Pulling the latest `main` after this slice brought in the missing
  `core/features/users/stripeSync.ts` 100% coverage slice.
- No customer email fixtures were used in this slice.

Recommendation:

Move next to `core/features/auth/oauth/base.ts` if branch coverage remains the
priority. If the goal is a smaller and lower-risk slice, cover
`core/dal/helpers.ts` or the remaining permission helper branches first.

### Stripe Fixture Type-Safety Cleanup - 2026-05-28

Files updated:

- `AGENTS.md`
- `package.json`
- `app/api/stripe/webhooks/route.test.ts`
- `app/api/stripe/create-checkout-session/route.test.ts`
- `app/api/stripe/create-portal-session/route.test.ts`
- `app/api/stripe/cancel-subscription/route.test.ts`
- `core/test-utils/factories/index.ts`
- `core/test-utils/factories/stripeEvent.ts`
- `core/test-utils/factories/stripeEvent.test.ts`
- `core/test-utils/mocks/stripe.ts`

Commands run:

- `npx.cmd biome format --write AGENTS.md package.json app/api/stripe/webhooks/route.test.ts app/api/stripe/create-checkout-session/route.test.ts app/api/stripe/create-portal-session/route.test.ts app/api/stripe/cancel-subscription/route.test.ts core/test-utils/factories/stripeEvent.ts core/test-utils/factories/stripeEvent.test.ts core/test-utils/factories/index.ts core/test-utils/mocks/stripe.ts`
- `npm.cmd test -- app/api/stripe/webhooks/route.test.ts app/api/stripe/create-checkout-session/route.test.ts app/api/stripe/create-portal-session/route.test.ts app/api/stripe/cancel-subscription/route.test.ts core/test-utils/factories/stripeEvent.test.ts --runInBand`
- `npm test`
- `npm.cmd run check:ci`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run typecheck`

Result:

- Focused Stripe route/factory tests passed: 5 test suites, 69 tests, 0
  snapshots.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `C:\nvm4w\nodejs\npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd run check:ci` passed: 270 files checked.
- `npm.cmd test -- --runInBand` passed: 60 test suites, 461 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 60 test suites, 461
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run typecheck` passed.
- Updated coverage summary: 95.96% statements, 95.19% branches, 90.1%
  functions, and 97.96% lines.

Notes:

- Replaced inline Stripe client double-casts in Stripe route tests with the
  named `asStripeClient` mock-boundary helper.
- Replaced inline `Stripe.Subscription` double-casts in webhook tests with
  `makeStripeSubscription` and `makeStripeCustomer` fixtures.
- Kept unavoidable broad casts centralized in named Stripe test factories and
  mocks, with comments explaining the minimal external SDK shapes.
- Added TypeScript quality guidance to `AGENTS.md`, including a no-`any`
  preference, and a conservative `typecheck` package script without changing
  `check:ci`.
- Test data continues to use synthetic ids and `@test.local` emails only.

Recommendation:

For the next focused cleanup, consider replacing remaining non-Stripe
`as unknown as` null-result mocks with typed helper constants near their test
modules. Keep that separate from coverage work unless it directly improves a
touched slice.

### DAL Helpers Coverage Slice - 2026-05-28

Files added or updated:

- `core/dal/helpers.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/dal/helpers.test.ts --runInBand`
- `npx.cmd jest core/dal/helpers.test.ts --coverage --collectCoverageFrom=core/dal/helpers.ts --runInBand`
- `npx.cmd biome format --write core/dal/helpers.test.ts`
- `npm test`
- `npm.cmd run check:ci`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/dal/helpers.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`

Result:

- Focused DAL helper Jest passed: 1 test suite, 5 tests, 0 snapshots.
- Focused DAL helper coverage probe passed: 1 test suite, 5 tests, 0 snapshots.
- `core/dal/helpers.ts` now reports 100% statements, 100% branches, 100%
  functions, and 100% lines.
- `npx.cmd biome format --write core/dal/helpers.test.ts` completed with no
  fixes needed.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `C:\nvm4w\nodejs\npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd run check:ci` passed: 271 files checked.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- `npm.cmd test -- --runInBand` passed: 61 test suites, 466 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 61 test suites, 466
  tests, 0 snapshots.
- Updated coverage summary: 96.07% statements, 95.5% branches, 90.1%
  functions, and 98.08% lines.
- Updated DAL coverage:
  - `core/dal/helpers.ts`: 100% statements, 100% branches, 100% functions, and
    100% lines.
  - `core/dal` aggregate: 88.88% statements, 100% branches, 85.71% functions,
    and 88.88% lines.

Notes:

- Added focused tests for `requireUser` and `requireUserWithData`, covering
  successful auth delegation, missing `userId`, and missing profile data.
- Mocked only the auth action module boundary.
- Test data uses existing synthetic user fixtures with `@test.local` emails.
- The known unsigned `npm.ps1` PowerShell blocker remains the only verification
  issue; the working `.cmd` test, coverage, type-check, lint, and CI check
  paths passed.

Recommendation:

Move next to `core/features/auth/oauth/base.ts` if branch coverage remains the
priority. For another compact slice, cover remaining permission helper branches
in `core/features/auth/permissions.ts`,
`core/features/interviews/permissions.ts`, or
`core/features/questions/permissions.ts`.

### OAuth Base Branch Coverage Slice - 2026-05-28

Files updated:

- `core/features/auth/oauth/base.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/auth/oauth/base.test.ts --runInBand`
- `npx.cmd jest core/features/auth/oauth/base.test.ts --coverage --collectCoverageFrom=core/features/auth/oauth/base.ts --runInBand`
- `npx.cmd biome format --write core/features/auth/oauth/base.test.ts`
- `npm test`
- `npm.cmd run check:ci`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint -- core/features/auth/oauth/base.test.ts AGENTS.md TEST_COVERAGE_PLAN.md`

Result:

- Focused OAuth base Jest passed: 1 test suite, 15 tests, 0 snapshots.
- Focused OAuth base coverage probe passed: 1 test suite, 15 tests, 0
  snapshots.
- `core/features/auth/oauth/base.ts` now reports 100% statements, 100%
  branches, 100% functions, and 100% lines.
- Initial sandboxed `npx.cmd biome format --write core/features/auth/oauth/base.test.ts`
  reported an access-denied internal I/O error; rerunning the same command with
  approval outside the sandbox passed and fixed the touched file.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `C:\nvm4w\nodejs\npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd run check:ci` passed: 271 files checked.
- `npm.cmd test -- --runInBand` passed: 61 test suites, 468 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 61 test suites, 468
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.
- Focused `biome lint` passed for the touched TypeScript test file.
  `AGENTS.md` and `TEST_COVERAGE_PLAN.md` were passed to the command but not
  checked by Biome.
- Updated coverage summary: 96.19% statements, 95.81% branches, 90.1%
  functions, and 98.2% lines.
- Updated OAuth coverage:
  - `core/features/auth/oauth/base.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.
  - `core/features/auth/oauth` aggregate: 99.32% statements, 92.45% branches,
    100% functions, and 99.65% lines.

Notes:

- Added branch coverage for the runtime unsupported-provider guard in
  `getOAuthClient`.
- Added coverage for truncating oversized OAuth HTTP error body previews.
- Kept mocks at existing OAuth module boundaries and made no production code
  changes.
- Test data uses synthetic `@test.local` emails only.
- The known unsigned `npm.ps1` PowerShell blocker remains the only verification
  issue; the working `.cmd` test, coverage, type-check, lint, and CI check
  paths passed.

Recommendation:

Move next to another compact branch gap: `core/features/auth/oauth/errors.ts`
for constructor branch coverage, or the remaining permission helper branches in
`core/features/auth/permissions.ts`,
`core/features/interviews/permissions.ts`, and
`core/features/questions/permissions.ts`. If OAuth branch coverage remains the
priority, `core/features/auth/oauth/connectUser.ts` is the next nearby target.

### OAuth Errors Branch Coverage Slice - 2026-05-28

Files added/updated:

- `core/features/auth/oauth/errors.test.ts`
- `TEST_COVERAGE_PLAN.md`

Commands run:

- `npm.cmd test -- core/features/auth/oauth/errors.test.ts --runInBand`
- `npx.cmd jest core/features/auth/oauth/errors.test.ts --coverage --collectCoverageFrom=core/features/auth/oauth/errors.ts --runInBand`
- `npx.cmd biome format --write core/features/auth/oauth/errors.test.ts`
- `npm test`
- `npm.cmd run check:ci`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npx.cmd next typegen`

Result:

- Focused OAuth errors Jest passed: 1 test suite, 10 tests, 0 snapshots.
- Focused OAuth errors coverage probe passed: 1 test suite, 10 tests, 0
  snapshots.
- `core/features/auth/oauth/errors.ts` now reports 100% statements, 100%
  branches, 100% functions, and 100% lines.
- Initial sandboxed focused coverage report writes failed with `EPERM` under
  `coverage`; rerunning the same command with approval outside the sandbox
  passed.
- Initial sandboxed `npx.cmd biome format --write core/features/auth/oauth/errors.test.ts`
  reported an access-denied internal I/O error; rerunning the same command with
  approval outside the sandbox passed.
- `npm test` still fails in PowerShell before Jest starts because the unsigned
  `C:\nvm4w\nodejs\npm.ps1` shim is blocked by the local execution policy.
- `npm.cmd run check:ci` passed: 272 files checked.
- `npm.cmd test -- --runInBand` passed: 62 test suites, 478 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 62 test suites, 478
  tests, 0 snapshots.
- Initial `npx.cmd tsc --noEmit` failed after the new test type issue was fixed
  because stale generated Next.js validator files referenced missing
  `app/api/cron/hello/route.js` modules.
- `npx.cmd next typegen` refreshed `.next/types`; removing the ignored stale
  `.next/dev/types` cache cleared the remaining dev validator reference.
- `npx.cmd tsc --noEmit` passed after regenerating/removing stale generated
  Next.js type files.
- Updated coverage summary: 96.19% statements, 96.43% branches, 90.1%
  functions, and 98.2% lines.
- Updated OAuth coverage:
  - `core/features/auth/oauth/errors.ts`: 100% statements, 100% branches, 100%
    functions, and 100% lines.
  - `core/features/auth/oauth` aggregate: 99.32% statements, 96.22% branches,
    100% functions, and 99.65% lines.

Notes:

- Added constructor coverage for OAuth error messages, names, provider context,
  validation causes, HTTP response context, blank body previews, and defensive
  runtime defaults for token HTTP errors.
- Made no production code changes.
- Test data uses synthetic provider values only and no customer emails.
- The known unsigned `npm.ps1` PowerShell blocker remains for raw `npm test`.
- The stale `.next` validator references to the removed cron route were local
  generated artifacts and are cleared; `npx.cmd tsc --noEmit` now passes.

Recommendation:

Move next to `core/features/auth/oauth/connectUser.ts` to keep OAuth branch
coverage momentum. For the lowest-risk path, cover the remaining permission
helper branches in `core/features/auth/permissions.ts`,
`core/features/interviews/permissions.ts`, and
`core/features/questions/permissions.ts`.

### Cumulative Coverage Catch-up and App Cancellation Notice - 2026-06-12

Files added/updated in this slice:

- `app/app/_utils.test.ts`
- `TEST_COVERAGE_PLAN.md`
- `docs/test-coverage-history.md`

Commands run:

- `npm.cmd test -- app/app/_utils.test.ts --runInBand`
- `npx.cmd jest app/app/_utils.test.ts --coverage --collectCoverageFrom=app/app/_utils.ts --runInBand`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run check:ci`

Result:

- Focused cancellation notice Jest passed: 1 test suite, 10 tests, 0
  snapshots.
- Focused cancellation notice coverage passed with
  `app/app/_utils.ts` at 100% statements, 100% branches, 100% functions, and
  100% lines.
- Full Jest passed: 78 test suites, 624 tests, 0 snapshots.
- Full coverage passed: 78 test suites, 624 tests, 0 snapshots.
- Updated coverage summary: 97.45% statements, 99.37% branches, 94.34%
  functions, and 98.83% lines.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run check:ci` passed: 288 files checked.

Coverage history catch-up:

- The previous entry ended at 62 test suites and 478 tests. The current
  snapshot incorporates the testing work merged since then, including UI
  primitives and accessibility, AI and Stripe cron route branches, OAuth
  validation, job-info form and card behavior, auth server actions, proxy
  routing and Arcjet behavior, Stripe upgrade error messages, and Hume chat
  message condensation, plus app cancellation-notice tests for banner
  eligibility and Stripe failure handling.
- Current full-coverage areas include the app cancellation notice and upgrade
  helpers, API routes, auth OAuth modules, billing helpers, DAL helpers,
  feature actions and services, permissions, and core utilities.

Cancellation notice coverage:

- Added early-return coverage for free users, Pro users without a Stripe
  subscription id, and unavailable Stripe configuration, including assertions
  that Stripe subscription retrieval is skipped.
- Added coverage for active subscriptions not scheduled to cancel, valid
  future cancellation notices, invalid or missing `cancel_at` values, expired
  cancellation times, and Stripe retrieval failures.
- Used synthetic Stripe ids and existing `@test.local` user factories only.
- Fake system time is defined relative to `cancel_at` by one second in each
  direction, so the tests express the boundary directly without depending on
  fixed calendar years.
- Made no production code changes.

Recommendation:

Prioritize the remaining partial coverage in `core/components/ui`, Drizzle
schema declarations, and `core/services/hume/lib/condenseChatMessages.ts`.

### Hume Message Condensation Completion - 2026-06-12

Files updated:

- `core/services/hume/lib/condenseChatMessages.test.ts`
- `TEST_COVERAGE_PLAN.md`
- `docs/test-coverage-history.md`

Commands run:

- `npm.cmd test -- core/services/hume/lib/condenseChatMessages.test.ts --runInBand`
- `npx.cmd jest core/services/hume/lib/condenseChatMessages.test.ts --coverage --collectCoverageFrom=core/services/hume/lib/condenseChatMessages.ts --runInBand`
- `npx.cmd biome format --write core/services/hume/lib/condenseChatMessages.test.ts`
- `npm.cmd run check:ci`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`

Result:

- Focused Hume Jest passed: 1 test suite, 15 tests, 0 snapshots.
- `core/services/hume/lib/condenseChatMessages.ts` reached 100% statements,
  branches, functions, and lines.
- Biome CI passed: 288 files checked.
- Full Jest and coverage passed: 78 test suites, 630 tests, 0 snapshots.
- Updated coverage summary: 97.59% statements, 99.75% branches, 94.34%
  functions, and 98.99% lines.
- TypeScript passed.

Notes:

- Covered recognized JSON and return-event message types without their
  corresponding content property, unknown message types, and empty-string
  content retention.
- Made no production code changes.

### Hume Chat Event Retrieval Coverage - 2026-06-12

Files added/updated:

- `core/services/hume/lib/api.test.ts`
- `TEST_COVERAGE_PLAN.md`
- `docs/test-coverage-history.md`

Commands run:

- `npm.cmd test -- core/services/hume/lib/api.test.ts`
- `npx.cmd tsc --noEmit`
- `npm.cmd run check -- core/services/hume/lib/api.test.ts`
- `npm.cmd run check:ci`
- `npm.cmd test`
- `npm.cmd run test:coverage`

Result:

- Focused Hume API Jest passed: 1 test suite, 5 tests, 0 snapshots.
- `core/services/hume/lib/api.ts` reached 100% statements, branches, functions,
  and lines in the full coverage report.
- Scoped Biome passed: 289 files checked.
- Biome CI passed: 289 files checked.
- Full Jest and coverage passed: 79 test suites, 635 tests, 0 snapshots.
- Updated coverage summary: 97.6% statements, 99.75% branches, 94.36%
  functions, and 98.99% lines.
- TypeScript passed.

Notes:

- Mocked the Hume SDK at the package boundary and used the shared synthetic
  server environment helper.
- Covered ordered and empty async event iteration, client API-key
  configuration, pagination request arguments, SDK rejection, and mid-stream
  iterator failure.
- Made no production code changes.

### Alert Dialog UI Primitive Coverage - 2026-06-12

Files added/updated:

- `core/components/ui/alert-dialog.test.tsx`
- `TEST_COVERAGE_PLAN.md`
- `docs/test-coverage-history.md`

Commands run:

- `npm.cmd test -- core/components/ui/alert-dialog.test.tsx --runInBand`
- `npx.cmd jest core/components/ui/alert-dialog.test.tsx --coverage --collectCoverageFrom=core/components/ui/alert-dialog.tsx --runInBand`
- `npm.cmd run check -- core/components/ui/alert-dialog.test.tsx`
- `npm test`
- `npm.cmd run check:ci`
- `npm.cmd test -- --runInBand`
- `npm.cmd run test:coverage -- --runInBand`
- `npx.cmd tsc --noEmit`

Result:

- Focused alert dialog Jest passed: 1 test suite, 6 tests, 0 snapshots.
- `core/components/ui/alert-dialog.tsx` reached 100% statements, branches,
  functions, and lines.
- Scoped Biome passed: 290 files checked and 1 file formatted.
- Raw `npm test` remains blocked by the local unsigned `npm.ps1` PowerShell
  execution-policy restriction.
- Biome CI passed: 290 files checked.
- Full Jest and coverage passed: 80 test suites, 641 tests, 0 snapshots.
- Updated coverage summary: 97.7% statements, 99.75% branches, 94.36%
  functions, and 99.09% lines.
- TypeScript passed.

Notes:

- Covered public portal and overlay composition, slot and custom-class
  forwarding, trigger-driven opening, cancel dismissal, confirm execution and
  dismissal, and accessible title and description wiring.
- Used the real Radix primitives in jsdom through the shared render helper.
- Made no production code changes and did not touch auth session or cookie
  files.

### Billing Stripe Helper Contracts - 2026-06-13

Files added/updated:

- `core/features/billing/stripe.test.ts`
- `TEST_COVERAGE_PLAN.md`
- `docs/test-coverage-history.md`

Commands run:

- `npm.cmd test -- core/features/billing/stripe.test.ts --runInBand`
- `npx.cmd jest core/features/billing/stripe.test.ts --coverage --collectCoverageFrom=core/features/billing/stripe.ts --runInBand`
- `npx.cmd biome format --write core/features/billing/stripe.test.ts`
- `npm test`
- `npm.cmd run check:ci`
- `npm.cmd test -- --runInBand`
- `npx.cmd tsc --noEmit`

Result:

- Focused Stripe helper Jest passed: 1 test suite, 25 tests, 0 snapshots.
- Focused coverage reported 97.72% statements, 91.17% branches, 100%
  functions, and 97.43% lines for `core/features/billing/stripe.ts`.
- Biome CI passed: 291 files checked.
- Full Jest passed: 81 test suites, 666 tests, 0 snapshots.
- TypeScript passed.
- Raw `npm test` remains blocked by the unsigned `npm.ps1` PowerShell shim.

Notes:

- Covered APP_URL and Vercel URL precedence, development-only localhost,
  fail-closed non-development URLs, representative Stripe configuration gaps,
  encoded upgrade redirects, JSON and form idempotency keys, normalization and
  rejection limits, parse failures, unsupported content types, and Stripe
  constructor options.
- The localhost contract uses a guarded child Jest process with
  `NODE_ENV=development` because the Next Jest transform compile-folds
  `NODE_ENV` in the parent process. The focused parent coverage report cannot
  merge that subprocess, so it lists the localhost return as uncovered even
  though the behavior test passes.
- Mocked the Stripe package constructor and server environment boundary.
- Made no production changes and did not touch auth session or cookie work.

### Upgrade Return Revalidation - 2026-06-15

Files added/updated:

- `app/app/upgrade/actions.test.ts`
- `app/app/upgrade/_RevalidateOnStripeReturn.test.tsx`
- `TEST_COVERAGE_PLAN.md`
- `docs/test-coverage-history.md`

Commands run:

- `npm.cmd test -- app/app/upgrade/actions.test.ts --runInBand`
- `npm.cmd test -- app/app/upgrade/_RevalidateOnStripeReturn.test.tsx --runInBand`
- `npx.cmd jest app/app/upgrade/actions.test.ts --coverage --collectCoverageFrom=app/app/upgrade/actions.ts --runInBand`
- `npx.cmd jest app/app/upgrade/_RevalidateOnStripeReturn.test.tsx --coverage --collectCoverageFrom=app/app/upgrade/_RevalidateOnStripeReturn.tsx --runInBand`
- `npx.cmd biome format --write app/app/upgrade/actions.test.ts app/app/upgrade/_RevalidateOnStripeReturn.test.tsx`
- `npm test`
- `npm.cmd run check:ci`
- `npm.cmd test -- --runInBand`
- `npx.cmd tsc --noEmit`

Result:

- Focused action Jest passed: 1 test suite, 2 tests, 0 snapshots.
- Focused client-effect Jest passed: 1 test suite, 6 tests, 0 snapshots.
- Both target modules reached 100% statements, branches, functions, and lines.
- Raw `npm test` remains blocked by the unsigned `npm.ps1` PowerShell shim.
- Biome CI passed: 293 files checked.
- Full Jest passed: 83 test suites, 674 tests, 0 snapshots.
- TypeScript passed.

Notes:

- Covered signed-in and anonymous server revalidation without real Next cache
  or auth calls.
- Covered each Stripe return flag, refresh ordering after the action settles,
  rejection logging with the `.finally()` refresh, and the single-run ref
  guard across a dependency-changing rerender.
- Used shared synthetic current-user factories and `TEST_USER_ID`.
- Made no production changes and did not touch auth session, cookie, or token
  work.

### Select UI Primitive Coverage - 2026-06-16

Files added/updated:

- `core/components/ui/select.test.tsx`
- `TEST_COVERAGE_PLAN.md`
- `docs/test-coverage-history.md`

Commands run:

- `npm.cmd test -- core/components/ui/select.test.tsx`
- `npx.cmd jest core/components/ui/select.test.tsx --coverage --collectCoverageFrom=core/components/ui/select.tsx --runInBand`
- `npm.cmd run check -- core/components/ui/select.test.tsx`
- `npx.cmd tsc --noEmit`
- `npm test`
- `npm.cmd run check:ci`
- `npm.cmd test`
- `npm.cmd run test:coverage`

Result:

- Focused Select UI primitive Jest passed: 1 test suite, 7 tests, 0 snapshots.
- Focused Select coverage reported 100% statements, branches, functions, and
  lines for `core/components/ui/select.tsx`.
- Scoped Biome passed and formatted the new test file.
- TypeScript passed.
- Raw `npm test` remains blocked by the unsigned `C:\nvm4w\nodejs\npm.ps1`
  PowerShell execution-policy restriction.
- Biome CI passed: 296 files checked.
- Full Jest passed: 86 test suites, 704 tests, 0 snapshots.
- Full coverage passed: 86 test suites, 704 tests, 0 snapshots.
- Updated coverage summary: 98.11% statements, 99.29% branches, 95.53%
  functions, and 99.33% lines.
- `core/components/ui/select.tsx` now reports 100% statements, 100% branches,
  100% functions, and 100% lines.
- `core/components/ui` aggregate now reports 98.55% statements, 96.15%
  branches, 100% functions, and 98.51% lines.

Notes:

- Added a local `ExperienceLevelSelect` fixture using the real shadcn/Radix
  wrappers in jsdom.
- Covered wrapper slot attributes and custom class forwarding for trigger,
  value, content, group, label, item, and separator.
- Covered default and `sm` trigger sizing through `data-size`, and both popper
  and item-aligned content positioning paths.
- Covered trigger-driven opening, option roles, accessible trigger naming, and
  selecting the "Senior" option.
- Covered public scroll-button exports only to close the wrapper export line
  coverage gap; no Radix internals were mocked.
- Made no production changes and did not touch auth session, cookie, or token
  work.

### Form UI Primitive Branch Coverage - 2026-06-16

Files updated:

- `core/components/ui/form.test.tsx`
- `core/components/ui/form.tsx`
- `TEST_COVERAGE_PLAN.md`
- `docs/test-coverage-history.md`

Commands run:

- `npm.cmd test -- core/components/ui/form.test.tsx`
- `npx.cmd jest core/components/ui/form.test.tsx --coverage --collectCoverageFrom=core/components/ui/form.tsx --runInBand`
- `npx.cmd tsc --noEmit`
- `npm.cmd run check -- core/components/ui/form.test.tsx`
- `npm.cmd run check:ci`
- `npm test`
- `npm.cmd test`
- `npm.cmd run test:coverage`

Result:

- Focused Form UI primitive Jest passed: 1 test suite, 10 tests, 0 snapshots.
- Focused Form coverage reported 100% statements, branches, functions, and
  lines for `core/components/ui/form.tsx`.
- TypeScript passed.
- Scoped Biome passed and formatted the touched test file.
- Biome CI passed: 296 files checked.
- Raw `npm test` remains blocked by the unsigned `C:\nvm4w\nodejs\npm.ps1`
  PowerShell execution-policy restriction.
- Full Jest passed: 86 test suites, 711 tests, 0 snapshots.
- Full coverage passed: 86 test suites, 711 tests, 0 snapshots.
- Updated coverage summary: 98.2% statements, 99.53% branches, 95.53%
  functions, and 99.43% lines.
- `core/components/ui/form.tsx` now reports 100% statements, 100% branches,
  100% functions, and 100% lines.
- `core/components/ui` aggregate now reports 100% statements, 100% branches,
  100% functions, and 100% lines.

Notes:

- Added branch coverage for empty-string and undefined validation-error
  messages rendering no `FormMessage`.
- Added label valid/invalid `data-error` coverage and FormItem slot/custom
  class forwarding coverage.
- Added direct public-hook coverage for `useFormField`, including the
  missing-`FormField` guard.
- Fixed a real guard bug in `core/components/ui/form.tsx`: the context default
  was a truthy object, making the defensive missing-`FormField` error
  unreachable. The field context now defaults to `undefined`, and the guard
  runs before deriving field state.
- Did not touch auth session, cookie, or token work.

## Coverage Priorities

1. Review Drizzle schema coverage separately.

   The remaining function gaps are primarily declarative schema modules:

   - `core/drizzle/schema/interview.ts`
   - `core/drizzle/schema/jobInfo.ts`
   - `core/drizzle/schema/question.ts`
   - `core/drizzle/schema/session.ts`
   - `core/drizzle/schema/token.ts`
   - `core/drizzle/schema/user.ts`
   - `core/drizzle/schema/userOAuthAccount.ts`

   Prefer meaningful schema constraint and relation tests over assertions added
   only to increase coverage percentages.

2. Protect full-coverage areas when behavior changes.

   Keep focused regression tests alongside changes to:

   - API routes and proxy routing
   - Auth actions, OAuth modules, and auth components
   - Billing and Stripe synchronization
   - Feature actions, services, permissions, and formatters
   - App upgrade and subscription-notice helpers

4. Keep external systems mocked at module boundaries.

   Continue using the existing Stripe, database, Next.js, AI, Hume, and Arcjet
   boundaries. Add factories or mock surfaces only with the first test that
   requires them.

## Recommended Starting Point

Start the next slice with one focused UI primitive. Run the full coverage
report afterward, and treat Drizzle schema declarations as a separate quality
decision rather than chasing their function percentage mechanically.
