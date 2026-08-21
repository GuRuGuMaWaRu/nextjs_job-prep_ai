# Curriculum Map

The module sequence is fixed at the conceptual level. Detailed later modules are authored just in time so their explanations and exercises can respond to demonstrated understanding.

| Module | Core concept | Billing roadmap mapping | Prerequisite | Laboratory theme | Mastery outcome |
|---|---|---|---|---|---|
| Module 0 | Backend foundations | No production PR | Elementary TypeScript | Process memory, races, transactions, timeouts, duplicate delivery | Explain failure and durability at every current billing boundary |
| Module 1 | Invariants before architecture | PR 1 | Module 0 | Requirements versus enforceable properties | Explain each invariant, prevented failure, and enforcement layer |
| Module 2 | External API boundaries | PR 2 | Module 1 | Provider adapter and safe diagnostics | Diagnose a provider failure without exposing PII or secrets |
| Module 3 | Concurrency, uniqueness, and idempotency | PR 3 | Modules 0–2 | Competing inserts and ambiguous external creation | Separate database uniqueness from provider idempotency |
| Module 4 | State machines, ownership, and compare-and-set | PR 4 | Module 3 | Two claimants competing for one identity | Prove automatic synchronization cannot move customer ownership |
| Module 5 | Relational domain modeling | PR 5 | Modules 1 and 4 | Entity history versus a lossy projection | Derive entitlement from normalized history and fail closed |
| Module 6 | Changing live data safely | PRs 6, 8, and 9 | Module 5 | Restartable backfill and version coexistence | Execute expand–migrate–contract with a defensible rollback boundary |
| Module 7 | Eventual consistency and reconciliation | PR 7 | Modules 3, 5, and 6 | Dropped and reordered notifications | State the consistency guarantee and repair latency |
| Module 8 | Durable inboxes and event semantics | PRs 10 and 11 | Module 7 | Persist-before-acknowledge under crashes | Explain exactly what webhook HTTP `200` means |
| Module 9 | PostgreSQL workers | PR 12 | Modules 4 and 8 | Claims, leases, and stale completion | Explain why lease fencing is required |
| Module 10 | Operating asynchronous systems | PRs 13–15 | Modules 7–9 | Backlog diagnosis and wake-up outage | Isolate failures using logs, metrics, traces, and database state |
| Module 11 | Auditability and causality | PR 16 | Modules 4, 5, and 10 | Reconstructing a causal chain | Explain why entitlement exists using safe persisted identifiers |
| Module 12 | Transactional outbox and external effects | PRs 17 and 18 | Modules 3, 8, 9, and 11 | Local transaction plus ambiguous provider delivery | State the outbox guarantee and its exactly-once limit |
| Module 13 | Chaos, capacity, and operational judgment | PR 19 | Modules 0–12 | Compound failures and unfamiliar integration design | Diagnose, recover, and transfer the architecture selectively |

## Learning order

Do not skip directly to a production PR because its implementation looks interesting. Each module retrieves earlier concepts that later guarantees depend on.

Completing a PR does not mark a module mastered. Completing a module does not bypass a production observation gate required for a later destructive rollout.

## Typical effort balance

This is a diagnostic balance, not a schedule:

```text
20% foundational study and vocabulary
20% isolated experiments
35% production design and implementation
15% failure injection and diagnosis
10% teach-back and written reflection
```

If nearly all effort goes into reading, run a smaller experiment. If nearly all effort goes into coding, pause and reconstruct the model and guarantees.

