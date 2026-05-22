## Code Style

- Prefer early returns.
- Avoid inline styling.
- Follow best practices, reference implementation and apply epistemic reasoning.
- All code should be formatted for readability with logical parts separated by empty lines.
- In tests, place module-level `jest.mock(...)` calls before imports when mocking imported modules.

## General Rules

- Never ever log customer emails.

## Commits and Pull Requests

- Commit messages and PR titles created through Codex must use Conventional Commit style:
  `type(scope): concise summary`
- Use a short lowercase scope matching the touched area, such as `auth`, `stripe`, `billing`, `users`, `jobInfos`, `tests`, or `docs`.
- Common types include:
  - `feat` for user-facing features
  - `fix` for bug fixes
  - `test` for test-only changes
  - `refactor` for behavior-preserving code changes
  - `perf` for performance improvements
  - `docs` for documentation-only changes
  - `chore` for maintenance
- Examples:
  - `test(stripe): webhook route coverage and Stripe test fixtures`
  - `feat(auth): Unicode NFC normalization for passwords`
  - `perf(auth): dedupe getCurrentUser with React cache`
- PR descriptions should include a short summary, verification performed, and notes or risks when relevant.
