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
