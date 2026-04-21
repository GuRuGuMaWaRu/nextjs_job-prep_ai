import {
  createTestClientEnv,
  createTestServerEnv,
  type TestServerEnv,
} from "./env";

describe("createTestServerEnv", () => {
  it("returns a default env with safe placeholder values", () => {
    const env = createTestServerEnv();

    expect(env).toMatchObject<Partial<TestServerEnv>>({
      DATABASE_URL: expect.stringContaining("postgres://"),
      ARCJET_KEY: expect.any(String),
      HUME_API_KEY: expect.any(String),
      GEMINI_API_KEY: expect.any(String),
      CRON_SECRET: expect.any(String),
      OAUTH_REDIRECT_URL_BASE: expect.stringContaining("http"),
    });
  });

  it("shallow-merges overrides without mutating defaults", () => {
    const a = createTestServerEnv({ CRON_SECRET: "override-1" });
    const b = createTestServerEnv();

    expect(a.CRON_SECRET).toBe("override-1");
    expect(b.CRON_SECRET).not.toBe("override-1");
  });

  it("returns a fresh object on every call", () => {
    const a = createTestServerEnv();
    const b = createTestServerEnv();

    expect(a).not.toBe(b);
  });

  it("never leaks real-looking secret prefixes for Stripe live keys", () => {
    const env = createTestServerEnv();

    expect(env.STRIPE_SECRET_KEY).not.toMatch(/^sk_live_/);
    expect(env.STRIPE_WEBHOOK_SECRET).not.toMatch(/^whsec_[a-f0-9]{32,}/);
  });
});

describe("createTestClientEnv", () => {
  it("returns a default client env with NEXT_PUBLIC_HUME_CONFIG_ID", () => {
    const env = createTestClientEnv();

    expect(env.NEXT_PUBLIC_HUME_CONFIG_ID).toEqual(expect.any(String));
    expect(env.NEXT_PUBLIC_HUME_CONFIG_ID.length).toBeGreaterThan(0);
  });

  it("applies overrides", () => {
    const env = createTestClientEnv({ NEXT_PUBLIC_HUME_CONFIG_ID: "custom" });

    expect(env.NEXT_PUBLIC_HUME_CONFIG_ID).toBe("custom");
  });
});
