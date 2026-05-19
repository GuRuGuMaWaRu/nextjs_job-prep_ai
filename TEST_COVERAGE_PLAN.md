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
