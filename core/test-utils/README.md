# `core/test-utils/`

Shared Jest test infrastructure. Everything here is imported via the
`@core/test-utils/*` alias and is consumed only by `*.test.ts` /
`*.test.tsx` files.

This folder grows incrementally — add a helper only when a real test needs it.

## Layout

- `env.ts` — `createTestServerEnv`, `createTestClientEnv`. Return safe,
  placeholder env objects for mocking `@/core/data/env/*`.
- `factories/` — pure data builders: `makeUser`, `makeProUser`,
  `makeSession`, `makeExpiredSession`.
- `render.tsx` — `renderWithProviders` that wraps children in
  `ThemeProvider` + `Toaster`, plus a re-export of every RTL export.
- `mocks/next.ts` — factories for stubbing `next/cache`, `next/headers`,
  and `next/navigation`, plus tagged error classes for redirect / notFound.

## Conventions

- **Never call real services** in tests (Stripe, Google AI, Hume, Arcjet,
  the database, OAuth providers). Always stub at the module boundary.
- **Never store real customer emails or payment identifiers** in fixtures.
  Defaults use the `@test.local` domain and `sk_test_*` / `whsec_test_*`
  placeholders.
- **Factories return fresh objects** with unique ids / tokens / emails per
  call so multi-entity tests don't collide.
- **Overrides are shallow-merged** over defaults.
- **AAA pattern** (Arrange / Act / Assert) with blank lines between
  sections. Describe per unit-under-test, one behavior per `it`.
- **Query by role / name** in component tests (`getByRole`,
  `getByLabelText`, `findByText`). Avoid `data-testid` unless no
  accessible query works.

## Mocking `@/core/data/env/server`

Because `@t3-oss/env-nextjs` validates env at import time, any test that
transitively imports `@/core/data/env/server` must stub it first. Pattern:

```ts
import { createTestServerEnv, type TestServerEnv } from "@core/test-utils/env";

let mockEnv: TestServerEnv = createTestServerEnv();

jest.mock("@/core/data/env/server", () => ({
  get env() {
    return mockEnv;
  },
}));

beforeEach(() => {
  mockEnv = createTestServerEnv();
});
```

## Mocking `next/*` modules

`jest.mock` calls are hoisted above imports, so factory bodies must resolve
helpers via `require`:

```ts
jest.mock("next/cache", () => {
  const { createNextCacheMock } = require("@core/test-utils/mocks/next");
  return createNextCacheMock();
});

import { revalidatePath } from "next/cache";

beforeEach(() => {
  (revalidatePath as jest.Mock).mockClear();
});
```

Redirect-based flows can use the tagged error classes:

```ts
import { NextRedirectError } from "@core/test-utils/mocks/next";

await expect(signOutAction()).rejects.toBeInstanceOf(NextRedirectError);
```

## Planned additions (ship with the PR that first needs them)

- `mocks/stripe.ts` — Stripe client + signed webhook event fixture builder.
- `mocks/db.ts` — chainable Drizzle query mock.
- `mocks/ai.ts` — AI SDK stream stubs.
- `mocks/arcjet.ts` — Arcjet `protect` allow/deny scenarios.
- `mocks/hume.ts` — Hume API and `@humeai/voice-react` stubs.
- `factories/jobInfo.ts`, `factories/interview.ts`, `factories/question.ts`,
  `factories/stripeEvent.ts` — per-feature fixture builders.
