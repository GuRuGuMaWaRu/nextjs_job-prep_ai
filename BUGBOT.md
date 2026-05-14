# Review Standards

## Test coverage

- Require Jest coverage for new behavior in auth, billing, AI workflows, and
  database-backed feature flows.
- Prefer narrow unit tests around module boundaries. Stub external services
  such as Stripe, OAuth providers, Google AI, Hume, Arcjet, and the database.
- Use shared helpers from `core/test-utils/` instead of ad hoc fixtures or
  one-off mocks when a helper already exists.
- Current baseline:
  - Jest runs as separate `node` (`*.test.ts`) and `jsdom` (`*.test.tsx`)
    projects.
  - React Testing Library coverage exists for shared UI helpers.
  - Auth/OAuth provider, linking, error-return, and connection flows have
    coverage.
  - Stripe webhook route branching and Stripe fixture helpers have coverage.
- Planned next coverage helpers:
  - `core/test-utils/mocks/db.ts` for chainable Drizzle query mocks.
  - `core/test-utils/mocks/ai.ts` for AI SDK stream stubs.
  - `core/test-utils/mocks/arcjet.ts` for allow/deny protection scenarios.
  - `core/test-utils/mocks/hume.ts` for Hume API and voice-react stubs.
  - Feature factories for job info, interviews, and questions.
- When reviewing PRs, flag new feature logic without either a focused test or
  an explicit explanation for why the behavior is covered elsewhere.

## Security-sensitive areas

## Common patterns to enforce

- Flag TODO comments without linked issues
- Flag new dependencies without justification in PR description

## Documentation checks

- If new features are added, require README updates
- Flag outdated code comments that reference changed behavior
