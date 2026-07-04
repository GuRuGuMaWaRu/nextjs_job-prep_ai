# Atomic Question and Interview Quota Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make free-plan question and interview creation enforce quotas atomically under concurrent requests.

**Architecture:** Add transaction-aware count-and-insert database operations that serialize per user with a row lock. Expose permission-layer reservation functions for unlimited and limited users, and replace the authoritative write sites while retaining read-only preflight checks where useful.

**Tech Stack:** Next.js 16, TypeScript, Drizzle ORM, PostgreSQL, Jest

---

### Task 1: Question reservation behavior

**Files:**
- Modify: `core/features/questions/permissions.test.ts`
- Modify: `core/features/questions/permissions.ts`
- Modify: `core/features/questions/db.ts`
- Modify: `app/api/ai/questions/generate-question/route.test.ts`
- Modify: `app/api/ai/questions/generate-question/route.ts`

- [x] Add failing permission tests proving unlimited users insert directly, limited users use atomic insertion, exhausted quota returns no reservation, unavailable permission rejects, and database errors propagate.
- [x] Run `npx jest core/features/questions/permissions.test.ts --runInBand --no-watchman` and confirm the new tests fail because reservation APIs do not exist.
- [x] Add `tryInsertQuestionDb`, using a transaction, `UserTable` row lock, transaction-scoped count, limit check, insert, and post-transaction cache revalidation.
- [x] Add `reserveQuestionUsage` and minimally update route tests and the generation callback to use it for the authoritative insert.
- [x] Run question permission and route tests and confirm they pass.

### Task 2: Interview reservation behavior

**Files:**
- Modify: `core/features/interviews/permissions.test.ts`
- Modify: `core/features/interviews/permissions.ts`
- Modify: `core/features/interviews/db.ts`
- Modify: `core/features/interviews/actions.test.ts`
- Modify: `core/features/interviews/actions.ts`

- [x] Add failing permission tests for unlimited, unavailable, successful limited, exhausted limited, and database-error reservation behavior.
- [x] Update action tests to require rate limiting and ownership checks before the authoritative reservation.
- [x] Run focused interview tests and confirm the reservation tests fail for the expected missing behavior.
- [x] Add `tryInsertInterviewDb`, using the same per-user transaction lock and counting all created interview rows for creation quota.
- [x] Add `reserveInterviewUsage` and replace action-level check-then-create with atomic reservation after rate-limit and ownership checks.
- [x] Run interview permission and action tests and confirm they pass.

### Task 3: Database transaction contract tests

**Files:**
- Modify: `core/test-utils/mocks/db.ts`
- Create: `core/features/questions/db.test.ts`
- Create: `core/features/interviews/db.test.ts`

- [x] Extend the typed Drizzle test chain with `.for("update")` support.
- [x] Add focused tests asserting each limited reservation uses one transaction, locks before counting, returns null at limit, and inserts below limit.
- [x] Run both database test files and confirm they pass.

### Task 4: Verification and audit

**Files:**
- Modify: `docs/superpowers/plans/2026-07-04-atomic-question-interview-quota.md`

- [x] Run focused Jest suites for questions and interviews.
- [x] Run `npx jest --runInBand --no-watchman`.
- [x] Run `npx biome check` on changed source and test files.
- [x] Run `npx tsc --noEmit`.
- [x] Inspect `git diff` and summarize remaining quota edges from the approved design.
