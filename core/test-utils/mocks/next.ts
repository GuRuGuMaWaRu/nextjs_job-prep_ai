/**
 * Factories for stubbing Next.js server-side modules in Jest.
 *
 * Jest hoists `jest.mock` calls above imports, so factories must resolve
 * their dependencies via `require` inside the factory body:
 *
 * @example
 *   jest.mock("next/cache", () => {
 *     const { createNextCacheMock } = require("@core/test-utils/mocks/next");
 *     return createNextCacheMock();
 *   });
 *
 *   import { revalidatePath } from "next/cache";
 *
 *   beforeEach(() => {
 *     (revalidatePath as jest.Mock).mockClear();
 *   });
 *
 * Each factory returns a fresh object per call, so nothing persists between
 * test files beyond what `jest.mock` itself caches.
 */

export type NextCacheMock = {
  revalidatePath: jest.Mock;
  revalidateTag: jest.Mock;
  cacheTag: jest.Mock;
  unstable_cache: jest.Mock;
  unstable_noStore: jest.Mock;
};

/**
 * Mock for `next/cache`.
 *
 * - `unstable_cache` returns the underlying function untouched so cached
 *   reads behave like direct calls in tests.
 * - `cacheTag` and `revalidateTag/Path` are bare `jest.fn()`s for assertions.
 */
export function createNextCacheMock(): NextCacheMock {
  return {
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
    cacheTag: jest.fn(),
    unstable_cache: jest.fn(
      <TArgs extends unknown[], TReturn>(
        fn: (...args: TArgs) => TReturn,
      ): ((...args: TArgs) => TReturn) => fn,
    ),
    unstable_noStore: jest.fn(),
  };
}

type CookieRecord = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export type MockCookieStore = {
  get: jest.Mock<CookieRecord | undefined, [string]>;
  getAll: jest.Mock<CookieRecord[], []>;
  has: jest.Mock<boolean, [string]>;
  set: jest.Mock<void, [string, string, Record<string, unknown>?]>;
  delete: jest.Mock<void, [string]>;
  _dump: () => CookieRecord[];
};

/**
 * Builds an isolated in-memory cookie store for a single test.
 */
export function createMockCookieStore(
  initial: CookieRecord[] = [],
): MockCookieStore {
  const store = new Map<string, CookieRecord>();

  for (const entry of initial) {
    store.set(entry.name, entry);
  }

  return {
    get: jest.fn((name: string) => store.get(name)),
    getAll: jest.fn(() => Array.from(store.values())),
    has: jest.fn((name: string) => store.has(name)),
    set: jest.fn(
      (name: string, value: string, options?: Record<string, unknown>) => {
        store.set(name, { name, value, options });
      },
    ),
    delete: jest.fn((name: string) => {
      store.delete(name);
    }),
    _dump: () => Array.from(store.values()),
  };
}

export type NextHeadersMock = {
  cookies: jest.Mock;
  headers: jest.Mock;
  /** Test-only accessor for the shared cookie store bound to this mock. */
  __cookieStore: MockCookieStore;
  /** Test-only accessor for the shared Headers instance bound to this mock. */
  __headers: Headers;
};

/**
 * Mock for `next/headers`.
 *
 * - `cookies()` resolves to a shared `MockCookieStore`, persisted across
 *   calls within a single mock so writes are observable on subsequent reads.
 * - `headers()` resolves to a shared `Headers` instance (mirroring real
 *   Next.js request-scoped semantics) so repeated `headers()` calls see the
 *   same state. Access `__headers` for direct seeding or assertions.
 */
export function createNextHeadersMock(
  initialCookies: CookieRecord[] = [],
  initialHeaders: Record<string, string> = {},
): NextHeadersMock {
  const cookieStore = createMockCookieStore(initialCookies);
  const headersInstance = new Headers(initialHeaders);

  return {
    cookies: jest.fn(async () => cookieStore),
    headers: jest.fn(async () => headersInstance),
    __cookieStore: cookieStore,
    __headers: headersInstance,
  };
}

export class NextRedirectError extends Error {
  readonly digest: string;

  constructor(
    url: string,
    kind: "REDIRECT" | "PERMANENT_REDIRECT" = "REDIRECT",
  ) {
    super(`NEXT_${kind} ${url}`);
    this.name = "NextRedirectError";
    this.digest = `NEXT_${kind};${url}`;
  }
}

export class NextNotFoundError extends Error {
  readonly digest = "NEXT_NOT_FOUND";

  constructor() {
    super("NEXT_NOT_FOUND");
    this.name = "NextNotFoundError";
  }
}

export type NextNavigationMock = {
  redirect: jest.Mock;
  permanentRedirect: jest.Mock;
  notFound: jest.Mock;
};

/**
 * Mock for `next/navigation` server helpers.
 *
 * `redirect` and `notFound` throw tagged errors matching Next's real behavior
 * so calling code that uses them as control-flow sentinels still works.
 */
export function createNextNavigationMock(): NextNavigationMock {
  return {
    redirect: jest.fn((url: string) => {
      throw new NextRedirectError(url, "REDIRECT");
    }),
    permanentRedirect: jest.fn((url: string) => {
      throw new NextRedirectError(url, "PERMANENT_REDIRECT");
    }),
    notFound: jest.fn(() => {
      throw new NextNotFoundError();
    }),
  };
}
