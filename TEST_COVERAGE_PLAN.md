# Test Coverage Plan

This document records the planned direction for expanding test coverage so it
can be referenced across future implementation chats.

## Current Baseline

- Run `npm test` before starting coverage work and record the current pass/fail
  state in the relevant PR or issue.
- Use the existing `npm run test:coverage` script to generate coverage data.
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
