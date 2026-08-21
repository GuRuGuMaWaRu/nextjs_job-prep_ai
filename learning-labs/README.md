# Learning Laboratory Safety

This directory is reserved for small experiments that isolate backend and distributed-systems concepts from production application complexity.

## Boundaries

- Create one directory per module, for example `learning-labs/00-backend-foundations/`.
- Use synthetic identifiers and disposable data only.
- Never use production database credentials, Stripe live-mode keys, customer emails, webhook payloads, tokens, or secrets.
- Provider experiments use test mode or a controlled fake.
- Database experiments use a disposable database, schema, or container.
- Every experiment documents how to start it, what evidence to observe, and how to clean it up.
- Do not import a learning lab from production application code.
- Do not turn a successful lab into production code by moving files unchanged. Redesign it against the production invariant, tests, and operational constraints.

## Experiment directory contract

Each experiment directory contains a README with:

```text
question
prediction artifact
setup and safe-data confirmation
execution command
observable evidence
cleanup command
result and revised mental model
```

Executable TypeScript is covered by the repository typecheck. JavaScript or TypeScript changes require `npm test`; TypeScript changes also require `npm run typecheck`.

