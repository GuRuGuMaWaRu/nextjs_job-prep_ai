# Just-in-Time Source Policy

Documentation is a tool for answering the question in front of us. It is not homework assigned to prove readiness.

## How sources enter the work

- Start from the production behavior or uncertainty we are investigating.
- Explain prerequisite knowledge directly when a source would be needlessly difficult or broad.
- Read the smallest authoritative section that can resolve the uncertainty.
- Make a prediction before reading only when comparing that prediction with evidence will teach something.
- Re-check provider behavior when it affects a production guarantee; documentation and operational limits can change.
- Record an access date for changeable pricing, limits, retention, retry, or delivery behavior.

## Labels

- `use when this question appears`: a primary source likely to resolve a recurring production question.
- `reference`: consult while designing or diagnosing; there is no need to read it in advance.
- `curiosity`: useful depth when it supports current interest without displacing the production thread.

## Source selection

- Prefer official standards, vendor documentation, and original research.
- Prefer free sources.
- Use a clear secondary explanation when a primary source assumes too much prerequisite knowledge.
- Do not assign a long document when one section answers the question.
- Pair a source with the concrete question it is meant to answer.
- Treat documentation claims and experimental observations as different kinds of evidence.

## Source catalog

### Boundaries and uncertainty

- `use when this question appears` — [MDN: Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
  - Question: What does an HTTP response communicate, and what does it not prove about later business processing?
- `use when this question appears` — [Node.js: Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
  - Question: How can one Node.js process interleave work for many requests even though JavaScript callbacks execute on an event loop?
- `reference` — [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html)
  - Question: What do database, table, row, query, and relation mean in the current experiment?
- `use when this question appears` — [PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
  - Question: Which local database changes become all-or-nothing, and where does that guarantee stop?

### Concurrency and database enforcement

- `use when this question appears` — [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
  - Question: How can the database reject an invalid state when concurrent callers both believe it is available?
- `reference` — [PostgreSQL: Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
  - Question: Which observations can change between statements and which anomalies require retry?
- `use when this question appears` — [PostgreSQL: Explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
  - Question: What does a row lock block, when is it released, and how can deadlock occur?
- `reference` — [PostgreSQL: SELECT locking clauses](https://www.postgresql.org/docs/current/sql-select.html)
  - Question: How do `FOR UPDATE` and `SKIP LOCKED` change competing workers' observations?

### Stripe boundaries

- `use when this question appears` — [Stripe: Receive webhook events](https://docs.stripe.com/webhooks)
  - Question: What duplicate, ordering, acknowledgement, and asynchronous-processing behavior must an endpoint expect?
- `use when this question appears` — [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
  - Question: Which logical identity lets a retry retrieve the result of an earlier provider operation?

### Operations

- `use when this question appears` — [OpenTelemetry: Signals](https://opentelemetry.io/docs/concepts/signals/)
  - Question: Which operational questions are best answered by traces, metrics, or logs?
- `reference` — [Vercel: Function limits](https://vercel.com/docs/functions/limitations)
  - Question: Which execution limits constrain a serverless worker design?
- `reference` — [Vercel: Managing cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
  - Question: What happens under overlapping, duplicated, or failed scheduled invocation?
- `reference` — [QStash: Schedules](https://upstash.com/docs/qstash/features/schedules)
  - Question: What does QStash schedule and retry, and what state does it not own in this architecture?

### External effects

- `use when this question appears` — [Resend: Idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
  - Question: How long can one provider identity suppress duplicate sends, and what ambiguity remains after that window?
- `use when this question appears` — [Resend: Webhook guarantees](https://resend.com/docs/webhooks/introduction)
  - Question: What duplication and ordering must delivery-outcome processing handle?

## Notes and safety

Write notes only when they will be useful later—for example, a subtle race, a production invariant, or a provider constraint future maintainers would otherwise rediscover. Short quotations are appropriate only when exact provider wording matters, with a direct link.

Never copy secrets, customer examples, real emails, tokens, or production payloads into learning notes or experiments.
