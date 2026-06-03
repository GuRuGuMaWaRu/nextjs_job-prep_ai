# Test Coverage Plan

This is the living dashboard for coverage work. Detailed historical slice logs
were archived in `docs/test-coverage-history.md` after the plan became too long
for practical handoff use.

## Current Status

Date: 2026-06-03

Latest full verification:

- `npm.cmd test -- core/features/auth/oauth/google.test.ts --runInBand`
  passed: 1 test suite, 8 tests, 0 snapshots.
- Focused coverage probes passed with 100% statements, branches, functions, and
  lines for:
  - `core/features/auth/oauth/google.ts`
- `npx.cmd biome format --write core/features/auth/oauth/google.test.ts
  TEST_COVERAGE_PLAN.md` passed.
- `npm test` still fails before Jest starts because unsigned
  `C:\nvm4w\nodejs\npm.ps1` is blocked by the local PowerShell execution
  policy.
- `npm.cmd run check:ci` passed: 279 files checked.
- `npm.cmd test -- --runInBand` passed: 69 test suites, 525 tests, 0 snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 69 test suites, 525
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.

Previous full verification:

- `npm run check:ci` passed: 279 files checked.
- `npm test -- --runInBand --watchman=false` passed: 69 test suites, 522 tests,
  0 snapshots.
- `npm run test:coverage -- --runInBand --watchman=false` passed: 69 test
  suites, 522 tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.

Latest coverage:

| Metric | Coverage |
| --- | ---: |
| Statements | 97.66% |
| Branches | 100% |
| Functions | 94.13% |
| Lines | 99.34% |

Recent file-specific result:

| File | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `core/features/auth/oauth/google.ts` | 100% | 100% | 100% | 100% |
| `core/features/auth/oauth` aggregate | 100% | 100% | 100% | 100% |

Latest slice notes:

- Added focused tests:
  - `core/features/auth/oauth/google.test.ts`
- Updated `TEST_COVERAGE_PLAN.md`.
- Removed the schema declaration test file because it mostly mirrored Drizzle
  metadata instead of testing user-visible behavior.
- Covered Google OAuth userinfo schema acceptance/rejection for valid emails,
  malformed emails, and invalid `email_verified` payloads.
- Focused Jest passed for the Google OAuth provider test file (8 tests).
- Focused coverage probe passed with 100% coverage for
  `core/features/auth/oauth/google.ts`.
- Full coverage is now 97.66% statements, 100% branches, 94.13% functions, and
  99.34% lines. This is intentionally lower than the declaration-test spike,
  but slightly above the previous useful baseline.
- No production code was changed in this slice.

## Working Rules

- Keep each coverage slice focused.
- Prefer tests over production changes unless a test reveals a real bug.
- Keep mocks at module boundaries.
- Use synthetic IDs and emails only, such as `@test.local`.
- Never log customer emails.
- Put module-level `jest.mock(...)` calls before imports when mocking imported
  modules.
- Run `npm test` after JavaScript or TypeScript changes even though raw
  PowerShell `npm` is currently blocked locally.

## Verification Checklist

For a typical TypeScript coverage slice, run:

1. Focused Jest:
   `npm.cmd test -- <test-file> --runInBand`
2. Focused coverage probe:
   `npx.cmd jest <test-file> --coverage --collectCoverageFrom=<source-file> --runInBand`
3. Format touched code:
   `npx.cmd biome format --write <touched files>`
4. Required raw attempt:
   `npm test`
5. Full CI formatting check:
   `npm.cmd run check:ci`
6. Full tests:
   `npm.cmd test -- --runInBand`
7. Full coverage:
   `npm.cmd run test:coverage -- --runInBand`
8. Type-check:
   `npx.cmd tsc --noEmit`

Known local quirks:

- Raw `npm test` fails in PowerShell before Jest starts because unsigned
  `C:\nvm4w\nodejs\npm.ps1` is blocked by the local execution policy. Use
  `npm.cmd` for real verification after recording the raw blocker.
- On this macOS worktree, Jest can fail before tests start when Watchman tries
  to write `~/Library/LaunchAgents/com.github.facebook.watchman.plist`. Add
  `--watchman=false` to Jest commands when that happens.
- Sandboxed coverage report writes can fail with `EPERM` under `coverage`.
  Rerun the same coverage command outside the sandbox when needed.
- Sandboxed Biome writes can fail with `Access is denied. (os error 5)` for
  touched files. Rerun the same Biome command outside the sandbox when needed.
- If `npx.cmd tsc --noEmit` reports stale `.next` route validators, run
  `npx.cmd next typegen`. If `.next/dev/types` still references removed local
  routes, remove that ignored generated cache and rerun `tsc`.
- Jest emits the existing `baseline-browser-mapping` warning. It has not
  blocked tests or coverage.

## Next Targets

Recommended next slice:

1. Behavior-oriented validation or operation gaps:
   - Form/server-action validation paths that reject malformed user input.
   - Service operations that create, update, delete, or enforce ownership.
   - API route error paths that exercise request parsing and expected outcomes.
2. Small residual helper gaps where behavior is meaningful:
   - `core/features/auth/constants.ts`
   - `core/test-utils/factories/index.ts`
3. Avoid declaration-only schema tests unless they are backed by integration
   behavior, migration behavior, or a documented high-risk database contract.

## Completed Slices

| Date | Slice | Key Result |
| --- | --- | --- |
| 2026-05-15 | Baseline | Started at 68.09% statements, 66.49% branches, 60.43% functions, 71.83% lines. |
| 2026-05-15 | Pure logic | Added tests for core libs, routes, schemas, and formatters. |
| 2026-05-15 | Password and permission helpers | Covered password behavior and first permission helper paths. |
| 2026-05-18 | Service layer | Covered job info, interview, and question service behavior. |
| 2026-05-19 | Job info server actions | `core/features/jobInfos/actions.ts` reached 100% coverage. |
| 2026-05-19 | Interview server actions | Covered interview action success, validation, and error paths. |
| 2026-05-19 | User action and service | Covered user actions/service and supporting DAL error helpers. |
| 2026-05-19 | Billing Stripe API routes | Covered checkout, portal, cancel, and webhook route behavior. |
| 2026-05-20 | Auth validate-session API route | Covered session validation route paths. |
| 2026-05-20 | AI generate question API route | Covered route validation, Arcjet, and AI response paths. |
| 2026-05-21 | AI generate feedback API route | Covered feedback route behavior and error handling. |
| 2026-05-21 | AI resume analyze API route | Covered resume analysis route behavior and error handling. |
| 2026-05-21 | Cron Stripe sync route | Covered Stripe subscription sync cron route paths. |
| 2026-05-22 | OAuth provider callback route | Covered provider callback route flow and return handling. |
| 2026-05-22 | Stripe API branch coverage | Expanded branch coverage for Stripe API routes. |
| 2026-05-22 | Auth OAuth components | Covered OAuth UI component states. |
| 2026-05-22 | Auth form components | Covered sign-in/sign-up form behavior. |
| 2026-05-26 | OAuth cookie helpers | Covered OAuth error return and last-used cookie helpers. |
| 2026-05-26 | OAuth base client | Covered core OAuth client behavior. |
| 2026-05-26 | OAuth GitHub provider | Covered GitHub OAuth provider parsing and verified-email behavior. |
| 2026-05-26 | OAuth Google and Discord factories | Covered Google and Discord provider factories. |
| 2026-05-26 | OAuth config edge cases | Covered OAuth config selection and missing config behavior. |
| 2026-05-26 | Billing webhook helpers | Covered webhook helper edge cases. |
| 2026-05-26 | Error toast utility | Covered safe toast error formatting. |
| 2026-05-26 | Upgrade subscription sync | Covered subscription sync-on-load behavior. |
| 2026-05-27 | Upgrade checkout success fallback | Covered checkout success fallback behavior. |
| 2026-05-27 | User Stripe sync branches | Covered user Stripe sync branch paths. |
| 2026-05-27 | Stripe webhook route branches | Expanded webhook branch coverage. |
| 2026-05-28 | Stripe fixture type-safety cleanup | Improved test fixture typing without broad casts. |
| 2026-05-28 | DAL helpers | `core/dal/helpers.ts` reached 100% coverage. |
| 2026-05-28 | OAuth base branches | `core/features/auth/oauth/base.ts` reached 100% coverage. |
| 2026-05-28 | OAuth errors branches | `core/features/auth/oauth/errors.ts` reached 100% coverage. |
| 2026-05-28 | OAuth connect user branches | `core/features/auth/oauth/connectUser.ts` reached 100% coverage. |
| 2026-05-28 | Permission helper branches | Auth, interview, and question permission helpers reached 100% coverage. |
| 2026-05-28 | Component utility coverage | `core/components/ui/password-input.tsx` and `core/components/ui/card.tsx` reached 100% coverage. |
| 2026-06-01 | Component utility coverage | `core/components/ui/badge.tsx` and `core/components/ui/sonner.tsx` reached 100% coverage. |
| 2026-06-01 | Component utility coverage | `core/components/ui/button.tsx` reached 100% coverage. |
| 2026-06-01 | Route branch coverage | AI question generation, resume analysis, and Stripe subscription cron routes reached 100% coverage. |
| 2026-06-01 | Component and helper gaps | OAuth sign-in section, billing webhook helpers, and interview service reached 100% coverage. |
| 2026-06-01 | Helper and fixture gaps | DAL errors, schema helpers, Stripe/user factories, and DB/Next mocks reached 100% coverage. |
| 2026-06-03 | Google OAuth validation | Google OAuth userinfo validation reached 100% provider coverage without declaration-only schema tests. |

## Archive

See `docs/test-coverage-history.md` for the original long-form slice history,
including command logs, older recommendations, and detailed notes.
