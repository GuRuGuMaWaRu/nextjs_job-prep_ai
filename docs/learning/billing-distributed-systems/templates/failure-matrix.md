# Failure Matrix

> **Optional tool:** Use this only when the resulting document will have future value. It is not required for progress.

Use a matrix when several failure points or recovery paths are difficult to compare in prose. Include only failures proportional to the guarantee being changed.

| Failure point | Persisted state before failure | Uncertain external state | User-visible result | Next trigger | Retry decision | Recovery owner | Expected final state | Evidence | Invariant preserved or violated | Remediation |
|---|---|---|---|---|---|---|---|---|---|---|

## Coverage questions

- What if the process dies immediately before each durable write?
- What if it dies immediately after each durable write?
- What if the external service succeeds but no response arrives?
- What if the same request or message arrives twice?
- What if related messages arrive out of order?
- What if two workers act concurrently?
- What if a stale worker resumes after another worker finishes?
- What if retry eligibility expires while the outcome remains uncertain?
- What if the monitoring system is unavailable during the failure?

## Gaps and uncertainty

List failure points that cannot yet be injected and the evidence or tooling needed to test them later.
