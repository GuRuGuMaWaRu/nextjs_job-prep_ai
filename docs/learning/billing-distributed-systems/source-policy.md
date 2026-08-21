# Primary-Source Policy

Readings support observation and experimentation; they do not replace them.

## Sequence

For each concept:

1. Inspect the current system.
2. Record a prediction and confidence.
3. State the question the reading should answer.
4. Read the smallest relevant primary source.
5. Update the prediction in a separate “after reading” section without deleting the original.
6. Run the experiment.
7. Record where documentation and observation differ or where assumptions remained.

## Labels

- `required`: needed for the module's concept or construction gate.
- `reference`: consult while designing or diagnosing; do not memorize.
- `optional deep dive`: useful after the transfer gate or when curiosity supports the current concept.

## Selection rules

- Prefer official standards, vendor documentation, and original research.
- Prefer free sources.
- Use secondary explanations only when primary material assumes knowledge the learner does not yet have.
- Pair every source with one explicit question.
- Do not assign a long document when one section answers the question.
- Record the access date when a source describes pricing, limits, retention, retries, or other changeable provider behavior.
- Verify provider behavior again during the production module; documentation can change.

## Initial catalog

### Backend foundations

- `required` — [MDN: Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
  - Question: What does an HTTP response communicate, and what does it not prove about later business processing?
- `required` — [Node.js: Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
  - Question: How can one Node.js process interleave work for many requests even though JavaScript callbacks execute on an event loop?
- `required` — [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html)
  - Question: What are the database, table, row, query, and relation concepts used in the laboratories?
- `required` — [PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
  - Question: Which local database changes become all-or-nothing, and where does that guarantee stop?

### Concurrency and database enforcement

- `required` — [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
  - Question: How can the database reject an invalid state when concurrent callers both believe it is available?
- `reference` — [PostgreSQL: Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
  - Question: Which observations can change between statements and which anomalies require retry?
- `required` — [PostgreSQL: Explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
  - Question: What does a row lock block, when is it released, and how can deadlock occur?
- `reference` — [PostgreSQL: SELECT locking clauses](https://www.postgresql.org/docs/current/sql-select.html)
  - Question: How do `FOR UPDATE` and `SKIP LOCKED` change competing workers' observations?

### Stripe boundaries

- `required` — [Stripe: Receive webhook events](https://docs.stripe.com/webhooks)
  - Question: What duplicate, ordering, acknowledgement, and asynchronous-processing behavior must an endpoint expect?
- `required` — [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
  - Question: Which logical identity lets a retry retrieve the result of an earlier provider operation?

### Operations

- `required` — [OpenTelemetry: Signals](https://opentelemetry.io/docs/concepts/signals/)
  - Question: Which operational questions are best answered by traces, metrics, or logs?
- `reference` — [Vercel: Function limits](https://vercel.com/docs/functions/limitations)
  - Question: Which execution limits constrain a serverless worker design?
- `reference` — [Vercel: Managing cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
  - Question: What happens under overlapping, duplicated, or failed scheduled invocation?
- `required` — [QStash: Schedules](https://upstash.com/docs/qstash/features/schedules)
  - Question: What does QStash schedule and retry, and what state does it not own in this architecture?

### External effects

- `required` — [Resend: Idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
  - Question: How long can one provider identity suppress duplicate sends, and what ambiguity remains after that window?
- `required` — [Resend: Webhook guarantees](https://resend.com/docs/webhooks/introduction)
  - Question: What duplication and ordering must delivery-outcome processing handle?

## Notes policy

Record concepts in your own language. Short quotations are used only when exact provider wording is necessary, and the source is linked directly. Never copy secrets, customer examples, or real payloads into notes.
