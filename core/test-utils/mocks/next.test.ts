import {
  NextNotFoundError,
  NextRedirectError,
  createMockCookieStore,
  createNextCacheMock,
  createNextHeadersMock,
  createNextNavigationMock,
} from "./next";

describe("createNextCacheMock", () => {
  it("returns jest.fn instances for revalidate primitives", () => {
    const mock = createNextCacheMock();

    expect(jest.isMockFunction(mock.revalidatePath)).toBe(true);
    expect(jest.isMockFunction(mock.revalidateTag)).toBe(true);
    expect(jest.isMockFunction(mock.cacheTag)).toBe(true);
    expect(jest.isMockFunction(mock.unstable_noStore)).toBe(true);
  });

  it("unstable_cache returns the underlying function untouched", () => {
    const mock = createNextCacheMock();
    const inner = jest.fn((a: number, b: number) => a + b);

    const cached = mock.unstable_cache(inner);
    const result = cached(2, 3);

    expect(result).toBe(5);
    expect(inner).toHaveBeenCalledWith(2, 3);
  });

  it("returns a fresh set of mocks per call", () => {
    const a = createNextCacheMock();
    const b = createNextCacheMock();

    expect(a.revalidatePath).not.toBe(b.revalidatePath);
  });
});

describe("createMockCookieStore", () => {
  it("starts empty when no initial cookies are provided", () => {
    const store = createMockCookieStore();

    expect(store.getAll()).toEqual([]);
    expect(store.get("missing")).toBeUndefined();
    expect(store.has("missing")).toBe(false);
  });

  it("seeds from initial records", () => {
    const store = createMockCookieStore([{ name: "session", value: "abc" }]);

    expect(store.get("session")).toEqual({ name: "session", value: "abc" });
    expect(store.has("session")).toBe(true);
  });

  it("set stores name/value/options and get reads them back", () => {
    const store = createMockCookieStore();

    store.set("k", "v", { httpOnly: true });

    expect(store.get("k")).toEqual({
      name: "k",
      value: "v",
      options: { httpOnly: true },
    });
  });

  it("delete removes entries", () => {
    const store = createMockCookieStore([{ name: "x", value: "1" }]);

    store.delete("x");

    expect(store.has("x")).toBe(false);
  });
});

describe("createNextHeadersMock", () => {
  it("returns the same cookie store across multiple cookies() calls", async () => {
    const mock = createNextHeadersMock();

    const a = await mock.cookies();
    const b = await mock.cookies();

    expect(a).toBe(b);
    expect(a).toBe(mock.__cookieStore);
  });

  it("headers() yields a Headers instance with the seeded values", async () => {
    const mock = createNextHeadersMock([], { "x-test": "yes" });

    const h = await mock.headers();

    expect(h.get("x-test")).toBe("yes");
    expect(h).toBe(mock.__headers);
  });

  it("headers() returns the same instance across calls so mutations persist", async () => {
    const mock = createNextHeadersMock([], { "x-test": "yes" });

    const first = await mock.headers();
    first.set("x-mutated", "1");
    const second = await mock.headers();

    expect(second).toBe(first);
    expect(second.get("x-mutated")).toBe("1");
    expect(mock.__headers).toBe(first);
  });
});

describe("createNextNavigationMock", () => {
  it("redirect throws a NextRedirectError with the right digest", () => {
    const mock = createNextNavigationMock();

    expect(() => mock.redirect("/sign-in")).toThrow(NextRedirectError);
    expect(mock.redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("permanentRedirect throws a permanent-redirect digest", () => {
    const mock = createNextNavigationMock();

    try {
      mock.permanentRedirect("/gone");
      throw new Error("expected permanentRedirect to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(NextRedirectError);
      expect((error as NextRedirectError).digest).toBe(
        "NEXT_PERMANENT_REDIRECT;/gone",
      );
    }
  });

  it("notFound throws a NextNotFoundError", () => {
    const mock = createNextNavigationMock();

    expect(() => mock.notFound()).toThrow(NextNotFoundError);
  });
});
