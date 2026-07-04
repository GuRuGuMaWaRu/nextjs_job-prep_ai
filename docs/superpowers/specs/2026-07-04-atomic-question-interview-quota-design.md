# Atomic Question and Interview Quota Reservations

## Goal

Prevent concurrent free-plan requests from exceeding question and interview quotas by applying the atomic reservation pattern established in PR #135.

## Architecture

Keep the existing permission checks as read-only gates for pages and inexpensive preflight rejection. Add quota-aware database insert functions that open a transaction, lock the owning user row with `SELECT ... FOR UPDATE`, count existing usage through that transaction, and insert only when the count remains below the free-plan limit.

Permission-layer reservation functions choose between a direct insert for unlimited users, an atomic quota-aware insert for limited users, and rejection for users without permission. Write paths call these reservation functions instead of independently checking and inserting.

## Question Generation

The route retains its preflight permission check so requests already at the limit do not invoke the AI provider. After generation finishes, the generated question is inserted through the authoritative reservation function. If concurrent requests passed preflight, the user-row lock ensures only the available number of questions are stored.

Because the authoritative insert occurs in the stream completion callback, a losing concurrent request may already have consumed AI tokens before its reservation is rejected. The stream callback must not emit a question ID unless insertion succeeds.

## Interview Creation

Authentication, Arcjet rate limiting, and job-info ownership validation happen before reservation. The final creation uses one reservation function that atomically counts and inserts the interview placeholder.

The quota represents interview creation, so the atomic count includes created interview rows whether or not `humeChatId` has subsequently been assigned. Completed-interview list behavior remains unchanged.

## Errors

Quota exhaustion returns the existing plan-limit response. Unexpected database failures continue through existing 500 or action-level database error handling rather than being misreported as quota exhaustion.

## Testing

- Permission tests cover unlimited, unavailable, successful limited reservation, exhausted quota, and propagated write failures.
- Route/action tests prove write paths use reservation functions and preserve validation ordering.
- Database integration tests run two concurrent reservations with one slot remaining and assert exactly one succeeds and the final count equals the limit.
- Run focused Jest tests, relevant integration tests when the test database is available, formatting checks, and `npx tsc --noEmit`.

## Remaining Quota Edges

- Concurrent question requests can both incur AI cost before one loses the final reservation.
- A created but abandoned interview consumes quota because creation itself is the reserved resource.
- Question and interview counts are lifetime totals; the product copy currently describes monthly limits, but no monthly reset/window is modeled.
- Deleting quota-bearing records restores capacity under count-based enforcement.
