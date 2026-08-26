# Five Learning Trails

The production billing system is the spine of the apprenticeship. These trails name recurring families of problems so we can connect discoveries over time without pretending they arrive in a fixed order.

We do not need to finish a trail before moving elsewhere. A trail may remain open while another production problem becomes the better vehicle for learning.

The roadmap guides the journey but does not predetermine the observed result.

## Trail 1 — Boundaries and uncertainty

This trail asks what each component can actually know and guarantee.

Questions likely to appear:

- What survives a request, process termination, or database rollback?
- What does an HTTP response prove, and only about which boundary?
- When a call times out, is the outcome failure or unknown?
- Where does a local transaction end when Stripe is involved?
- How do concurrency and interleaving create uncertainty?

These foundations are retrieved throughout the project, especially while making the first billing invariants executable in PR 1. We revisit a foundation when a real problem needs it; we do not repeat it to satisfy a prerequisite.

## Trail 2 — Recoverable checkout

This trail follows one human intention—subscribe—even when it produces retries, concurrent requests, lost responses, and uncertain provider outcomes.

Questions likely to appear:

- What is one logical checkout intent?
- Who creates and remembers its identity?
- Can two requests for that intent create two Stripe Checkout Sessions?
- What guarantee comes from PostgreSQL uniqueness, and what comes from Stripe idempotency?
- How does a checkout attempt recover after the provider succeeds but our response is lost?

This is expected to feed PR 1's executable billing invariants and PostgreSQL test harness, and likely expose provider-contract and durable-checkout work in PRs 2–4.

## Trail 3 — Subscription truth and access

This trail separates Stripe's resource state, our local subscription history, and the product decision to grant access.

Questions likely to appear:

- Which system is authoritative for each fact?
- Why is one subscription field on `User` a lossy model?
- How should current Stripe state become local subscription state?
- What does “Pro access” mean when payment state is delayed or disputed?
- How can schema changes and backfills coexist safely with deployed code?
- How does reconciliation repair missed or reordered notifications?

The discoveries here are likely to shape PRs 5–9: relational subscription modeling, synchronization, entitlements, migration, and reconciliation.

## Trail 4 — Durable asynchronous processing

This trail begins when an HTTP request is the wrong lifetime for work that must survive crashes and retries.

Questions likely to appear:

- What does acknowledging a Stripe webhook actually promise?
- Why persist before returning success?
- How does a database-backed worker claim work atomically?
- What happens when a worker dies after claiming or after committing?
- How do leases, fencing, retries, and dead letters constrain duplicate work?
- Which event data is advisory, and when should the worker fetch current resource state?

This trail is likely to become central in PRs 10–15: durable ingress, processing state, workers, recovery, retry policy, and operations.

## Trail 5 — External effects and operations

This trail follows business effects beyond the local billing transaction and asks how humans can understand and repair the system in production.

Questions likely to appear:

- How can a committed subscription change reliably lead to email or analytics work?
- What does a transactional outbox guarantee, and why is it not exactly-once delivery?
- How are duplicate effects made harmless at the domain or provider boundary?
- Which identifiers let us reconstruct why a user has access?
- Which logs, metrics, traces, and reconciliation tools reveal a stuck system?
- When does Postgres stop being the right transport, and what limitation would justify another queue?

These questions overlap with the later async work and are likely to shape PRs 13–19: operability, auditability, outbox processing, chaos testing, and justified infrastructure.

## Moving through the trails

A normal movement is:

```text
production problem → focused discovery → small experiment
→ understanding → production guarantee → proportional verification
→ next exposed problem
```

That movement may skip a step when it adds no learning value. It may also loop backward when production evidence contradicts the current mental model. The aim is a system you can reason about—not a completed curriculum table.
