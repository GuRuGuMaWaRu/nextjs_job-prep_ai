/**
 * Shared test env helper.
 *
 * The project validates environment variables at import time via
 * `@t3-oss/env-nextjs` in `@/core/data/env/server`. Tests that import anything
 * which transitively pulls that module in must stub it first to avoid real
 * env validation. Use together with `jest.mock`:
 *
 * @example
 *   import { createTestServerEnv, type TestServerEnv } from "@core/test-utils/env";
 *
 *   let mockEnv: TestServerEnv = createTestServerEnv();
 *
 *   jest.mock("@/core/data/env/server", () => ({
 *     get env() {
 *       return mockEnv;
 *     },
 *   }));
 *
 *   beforeEach(() => {
 *     mockEnv = createTestServerEnv();
 *   });
 */

export type TestServerEnv = {
  DATABASE_URL: string;
  ARCJET_KEY: string;
  HUME_API_KEY: string;
  HUME_SECRET_KEY: string;
  GEMINI_API_KEY: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRO_PRICE_ID?: string;
  STRIPE_PRO_PRODUCT_ID?: string;
  APP_URL?: string;
  CRON_SECRET: string;
  OAUTH_REDIRECT_URL_BASE: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

const TEST_ENV_DEFAULTS: TestServerEnv = {
  DATABASE_URL: "postgres://test:test@localhost:5432/test",
  ARCJET_KEY: "ajkey_test",
  HUME_API_KEY: "hume_test",
  HUME_SECRET_KEY: "hume_test_secret",
  GEMINI_API_KEY: "gemini_test",
  STRIPE_SECRET_KEY: "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_test_placeholder",
  STRIPE_PRO_PRICE_ID: "price_test_placeholder",
  STRIPE_PRO_PRODUCT_ID: "prod_test_placeholder",
  APP_URL: "http://localhost:3000",
  CRON_SECRET: "test_cron_secret",
  OAUTH_REDIRECT_URL_BASE: "http://localhost:3000/api/oauth/",
};

/**
 * Returns a fresh test env object with safe placeholder values.
 *
 * Never contains real secrets. Overrides are shallow-merged.
 */
export function createTestServerEnv(
  overrides: Partial<TestServerEnv> = {},
): TestServerEnv {
  return { ...TEST_ENV_DEFAULTS, ...overrides };
}

export type TestClientEnv = {
  NEXT_PUBLIC_HUME_CONFIG_ID: string;
};

const TEST_CLIENT_ENV_DEFAULTS: TestClientEnv = {
  NEXT_PUBLIC_HUME_CONFIG_ID: "test-hume-config-id",
};

export function createTestClientEnv(
  overrides: Partial<TestClientEnv> = {},
): TestClientEnv {
  return { ...TEST_CLIENT_ENV_DEFAULTS, ...overrides };
}
