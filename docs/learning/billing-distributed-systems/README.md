# Billing Distributed Systems Learning Lab

This course uses the project's real Stripe billing subsystem to build a transferable understanding of backend and distributed systems. The working billing system is evidence of learning; it is not the only deliverable.

The course assumes elementary backend knowledge. Terms such as transaction, idempotency, lease, reconciliation, and outbox are introduced through observation and experiments before they are required in production work.

## Start here

1. Read the [curriculum map](curriculum.md) to understand the sequence, not the solutions.
2. Read the [AI learning contract](ai-learning-contract.md) before asking AI for help.
3. Read the [mastery rubric](mastery-rubric.md) before evaluating progress.
4. Open [Module 0](modules/00-backend-foundations/README.md).
5. Copy the relevant files from [templates](templates/) into your Module 0 working directory when the guide asks for them.
6. Update [progress.md](progress.md) only when you have evidence for the new state.

Do not begin by reading the detailed production roadmap. Each module has an architecture-comparison gate. Read the relevant section of the frozen roadmap only after you have recorded your own first model and design.

## The spiral

Every module follows the same learning loop:

```text
observe → model → predict → experiment → design
→ write the first failing test → build → break
→ teach back → ship
```

If a mastery gate does not pass, make the experiment smaller or revisit the model. Time spent does not advance the course automatically.

## AI assistance

AI starts with questions, not solutions:

```text
Level 0 — Socratic questions only
Level 1 — One directional hint
Level 2 — Concept explanation using another domain
Level 3 — Pseudocode or a schema pattern after your attempt
Level 4 — Help with one explicitly named implementation obstacle
```

Level 4 permission expires when that obstacle is resolved. Your next activity returns to review-only assistance.

## Course documents

- [Curriculum map](curriculum.md)
- [AI learning contract](ai-learning-contract.md)
- [Mastery rubric](mastery-rubric.md)
- [Progress tracker](progress.md)
- [Source policy](source-policy.md)
- [Reasoning templates](templates/)
- [Approved learning design](../../superpowers/specs/2026-08-21-billing-distributed-systems-learning-design.md)
- [Frozen production architecture](../../superpowers/plans/2026-08-20-billing-subsystem-hardening-v2.md)
- [Laboratory safety rules](../../../learning-labs/README.md)

## Safety

- Use disposable data in learning laboratories.
- Use Stripe test mode.
- Never copy real customer data, emails, provider payloads, secrets, or tokens into learning notes.
- A successful experiment is not production-ready until the module's production and failure gates pass.
- No module may weaken the repository's normal migration, testing, or deployment requirements.

