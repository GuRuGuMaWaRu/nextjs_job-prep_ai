# Test Coverage Plan

This is the living dashboard for coverage work. Detailed historical slice logs
were archived in `docs/test-coverage-history.md` after the plan became too long
for practical handoff use.

## Current Status

Date: 2026-06-01

Latest full verification:

- `npm run check:ci` passed: 277 files checked.
- `npm test -- --runInBand --watchman=false` passed: 67 test suites, 499
  tests, 0 snapshots.
- `npm run test:coverage -- --runInBand --watchman=false` passed: 67 test
  suites, 499 tests, 0 snapshots.
- `npx tsc --noEmit` passed.
- `npx biome format --write core/components/ui/button.test.tsx` passed.
- Sandboxed coverage writes failed with `EPERM` for `coverage/coverage-final.json`;
  rerunning the focused and full coverage commands with elevated filesystem
  access passed.
- Sandboxed Biome format failed with `Operation not permitted`; rerunning with
  elevated filesystem access passed with no changes needed.
- Sandboxed `npx tsc --noEmit` failed with `EPERM` for
  `tsconfig.tsbuildinfo`; rerunning with elevated filesystem access passed.
- Initial `npm test -- core/components/ui/badge.test.tsx
  core/components/ui/sonner.test.tsx --runInBand` failed before Jest started
  because Watchman could not write
  `/Users/gurugumawaru/Library/LaunchAgents/com.github.facebook.watchman.plist`;
  rerunning with `--watchman=false` passed.
- Initial sandboxed `npm ci` failed with npm's `Exit handler never called`
  error while writing npm logs outside the workspace; rerunning with elevated
  filesystem access passed.

Previous full verification:

- `npm.cmd run check:ci` passed: 274 files checked.
- `npm.cmd test -- --runInBand` passed: 64 test suites, 489 tests, 0
  snapshots.
- `npm.cmd run test:coverage -- --runInBand` passed: 64 test suites, 489
  tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.

Latest coverage:

| Metric | Coverage |
| --- | ---: |
| Statements | 96.75% |
| Branches | 98.59% |
| Functions | 91.57% |
| Lines | 98.62% |

Recent file-specific result:

| File | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `core/features/auth/oauth/base.ts` | 100% | 100% | 100% | 100% |
| `core/features/auth/oauth/errors.ts` | 100% | 100% | 100% | 100% |
| `core/features/auth/oauth/connectUser.ts` | 100% | 100% | 100% | 100% |
| `core/features/auth/oauth` aggregate | 99.66% | 100% | 100% | 100% |
| `core/features/auth/permissions.ts` | 100% | 100% | 100% | 100% |
| `core/features/interviews/permissions.ts` | 100% | 100% | 100% | 100% |
| `core/features/questions/permissions.ts` | 100% | 100% | 100% | 100% |
| `core/components/ui/password-input.tsx` | 100% | 100% | 100% | 100% |
| `core/components/ui/card.tsx` | 100% | 100% | 100% | 100% |
| `core/components/ui/badge.tsx` | 100% | 100% | 100% | 100% |
| `core/components/ui/sonner.tsx` | 100% | 100% | 100% | 100% |
| `core/components/ui/button.tsx` | 100% | 100% | 100% | 100% |

Latest slice notes:

- Added `core/components/ui/button.test.tsx`.
- Updated `TEST_COVERAGE_PLAN.md`.
- Covered button prop forwarding, selected variant and size classes, `asChild`
  rendering, and exported variant helper output.
- Focused Jest passed:
- `npm test -- core/components/ui/button.test.tsx --runInBand
  --watchman=false` (4 tests).
- Focused coverage probe passed with 100% coverage for
  `core/components/ui/button.tsx`.
- Full coverage passed with `core/components/ui` aggregate at 100%
  statements, 100% branches, 100% functions, and 100% lines.
- Full coverage increased statements from 96.69% to 96.75%; branches,
  functions, and lines stayed at 98.59%, 91.57%, and 98.62%.
- `--watchman=false` remains required for Jest commands on this macOS worktree.
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

1. Route branch gaps:
   - `app/api/ai/questions/generate-question/route.ts`
   - `app/api/ai/resumes/analyze/route.ts`
   - `app/api/cron/sync-stripe-subscriptions/route.ts`
   - Good follow-up now that the low-risk component utility branches are
     exhausted.

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

## Archive

See `docs/test-coverage-history.md` for the original long-form slice history,
including command logs, older recommendations, and detailed notes.
