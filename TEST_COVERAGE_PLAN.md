# Test Coverage Plan

This is the living dashboard for coverage work. Detailed historical slice logs
were archived in `docs/test-coverage-history.md` after the plan became too long
for practical handoff use.

## Current Status

Date: 2026-06-15

Latest full verification:

- Focused upgrade action Jest passed: 1 test suite, 2 tests, 0 snapshots.
- Focused Stripe-return client Jest passed: 1 test suite, 6 tests, 0
  snapshots.
- Focused coverage reported 100% statements, branches, functions, and lines
  for both upgrade revalidation modules.
- `npx.cmd biome format --write` formatted both new test files and fixed one.
- `npm test` was attempted but remains blocked by the unsigned `npm.ps1`
  PowerShell execution-policy restriction.
- `npm.cmd run check:ci` passed: 293 files checked.
- `npm.cmd test -- --runInBand` passed: 83 test suites, 674 tests, 0 snapshots.
- `npx.cmd tsc --noEmit` passed.

Latest coverage:

| Metric | Coverage |
| --- | ---: |
| Statements | 97.7% |
| Branches | 99.75% |
| Functions | 94.36% |
| Lines | 99.09% |

Recent file-specific result:

| File | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `app/app/_utils.ts` | 100% | 100% | 100% | 100% |
| `app/app/upgrade/actions.ts` | 100% | 100% | 100% | 100% |
| `app/app/upgrade/_RevalidateOnStripeReturn.tsx` | 100% | 100% | 100% | 100% |
| `proxy.ts` | 100% | 100% | 100% | 100% |
| `core/features/auth/actions.ts` | 100% | 100% | 100% | 100% |
| `core/components/ui/action-button.tsx` | 100% | 100% | 100% | 100% |
| `core/components/ui/alert-dialog.tsx` | 100% | 100% | 100% | 100% |
| `core/components/ui/form.tsx` | 94.28% | 80% | 100% | 94.28% |
| `core/components/ui` aggregate | 94.92% | 96.15% | 94% | 94.81% |
| `core/features/billing/stripe.ts` | 97.72% | 91.17% | 100% | 97.43% |
| `core/services/hume/lib/api.ts` | 100% | 100% | 100% | 100% |
| `core/services/hume/lib/condenseChatMessages.ts` | 100% | 100% | 100% | 100% |

Latest slice notes:

- Added focused tests:
  - `app/app/upgrade/actions.test.ts`
  - `app/app/upgrade/_RevalidateOnStripeReturn.test.tsx`
- Updated `TEST_COVERAGE_PLAN.md` and `docs/test-coverage-history.md`.
- Covered signed-in and anonymous upgrade revalidation, including the upgrade
  path and current-user cache boundary.
- Covered all Stripe return flags, refresh-after-settlement ordering, rejected
  revalidation logging with refresh fallback, and the single-run ref guard.
- Focused Jest passed for both upgrade revalidation test files (8 tests total).
- Both target modules reached 100% focused coverage.
- Full Jest, TypeScript, scoped Biome formatting, and Biome CI verification
  passed.
- Made no production code changes.
- Did not touch auth session, cookie, or token work.

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

1. Behavior-oriented UI primitive gaps:
   - `core/components/ui/select.tsx` exported wrapper rendering where Radix
     behavior can be tested without brittle implementation assertions.
   - `core/components/ui/form.tsx` remaining fallback and message branches.
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
| 2026-06-08 | Action button behavior | `core/components/ui/action-button.tsx` reached 100% coverage with user-visible success, error, click, and pending-dialog behavior. |
| 2026-06-08 | Form accessibility behavior | Covered `core/components/ui/form.tsx` label, description, validation-message, invalid-state, and empty-message behavior. |
| 2026-06-08 | Auth server actions | Added direct coverage for auth action validation, duplicate email, bad password, sign-out, current-user cache behavior, and session validation branches. |
| 2026-06-10 | Proxy middleware | `proxy.ts` reached 100% coverage across Arcjet, auth, redirect, bypass, cookie, and matcher behavior. |
| 2026-06-10 | Upgrade error messages | Covered Stripe upgrade error-code and fallback-message behavior. |
| 2026-06-12 | Hume message condensation | `core/services/hume/lib/condenseChatMessages.ts` reached 100% coverage across valid, malformed, unknown, missing-content, and empty-string inputs. |
| 2026-06-12 | Hume chat event retrieval | `core/services/hume/lib/api.ts` reached 100% coverage for ordered and empty event streams, SDK calls, and error propagation. |
| 2026-06-12 | App cancellation notice | `app/app/_utils.ts` reached 100% coverage for Pro cancellation-banner eligibility and Stripe failure handling. |
| 2026-06-12 | Alert dialog UI primitive | `core/components/ui/alert-dialog.tsx` reached 100% coverage for composition, prop forwarding, interactions, and accessibility. |
| 2026-06-13 | Billing Stripe helpers | Added 25 direct contract tests for Stripe configuration, redirect, idempotency, and client helpers. |
| 2026-06-15 | Upgrade return revalidation | Covered server revalidation and the Stripe-return client refresh flow at 100%. |

## Archive

See `docs/test-coverage-history.md` for the original long-form slice history,
including command logs, older recommendations, and detailed notes.
