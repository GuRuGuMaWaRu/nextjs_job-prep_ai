import { spawnSync } from "node:child_process";
import { join } from "node:path";

let mockEnv: import("@core/test-utils/env").TestServerEnv;

jest.mock("@/core/data/env/server", () => ({
  get env() {
    return mockEnv;
  },
}));

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn(() => ({ client: "stripe-test-client" })),
}));

import Stripe from "stripe";

import {
  getIdempotencyKeyFromRequest,
  getStripe,
  getStripeBaseUrl,
  getUpgradeErrorRedirect,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { createTestServerEnv } from "@core/test-utils/env";

const mockStripeConstructor = jest.mocked(Stripe);
const originalVercelUrl = process.env.VERCEL_URL;
const isDevelopmentProbe =
  process.env["STRIPE_BASE_URL_DEVELOPMENT_PROBE"] === "true";

function buildJsonRequest(body: string): Request {
  return new Request("https://app.test/api/stripe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

function buildUrlEncodedRequest(body: URLSearchParams): Request {
  return new Request("https://app.test/api/stripe", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
}

function buildMultipartRequest(body: FormData): Request {
  return new Request("https://app.test/api/stripe", {
    method: "POST",
    body,
  });
}

beforeEach(() => {
  mockEnv = createTestServerEnv();
  delete process.env.VERCEL_URL;
});

afterAll(() => {
  if (originalVercelUrl === undefined) {
    delete process.env.VERCEL_URL;
    return;
  }

  process.env.VERCEL_URL = originalVercelUrl;
});

describe("billing Stripe helpers", () => {
  describe("getStripeBaseUrl", () => {
    it("returns APP_URL when both application and Vercel URLs are set", () => {
      mockEnv = createTestServerEnv({ APP_URL: "https://app.test" });
      process.env.VERCEL_URL = "preview.vercel.app";

      const result = getStripeBaseUrl();

      expect(result).toBe("https://app.test");
    });

    it("falls back to an HTTPS Vercel URL when APP_URL is unset", () => {
      mockEnv = createTestServerEnv({ APP_URL: undefined });
      process.env.VERCEL_URL = "preview.vercel.app";

      const result = getStripeBaseUrl();

      expect(result).toBe("https://preview.vercel.app");
    });

    it("returns localhost only in development when no configured URL exists", () => {
      if (!isDevelopmentProbe) {
        const testResult = spawnSync(
          process.execPath,
          [
            join(process.cwd(), "node_modules", "jest", "bin", "jest.js"),
            "core/features/billing/stripe.test.ts",
            "--runInBand",
            "--no-cache",
            "--testNamePattern=returns localhost only",
          ],
          {
            cwd: process.cwd(),
            encoding: "utf8",
            env: {
              ...process.env,
              NODE_ENV: "development",
              STRIPE_BASE_URL_DEVELOPMENT_PROBE: "true",
            },
          },
        );

        expect(testResult.status).toBe(0);
        return;
      }

      mockEnv = createTestServerEnv({ APP_URL: undefined });

      const result = getStripeBaseUrl();

      expect(result).toBe("http://localhost:3000");
    });

    it("returns null outside development when no configured URL exists", () => {
      mockEnv = createTestServerEnv({ APP_URL: undefined });

      const result = getStripeBaseUrl();

      expect(result).toBeNull();
    });
  });

  describe("isStripeConfigured", () => {
    it.each([
      {
        label: "a price id",
        overrides: {
          STRIPE_PRO_PRICE_ID: "price_test_pro",
          STRIPE_PRO_PRODUCT_ID: undefined,
        },
      },
      {
        label: "a product id",
        overrides: {
          STRIPE_PRO_PRICE_ID: undefined,
          STRIPE_PRO_PRODUCT_ID: "prod_test_pro",
        },
      },
    ])("returns true with all required values and $label", ({ overrides }) => {
      mockEnv = createTestServerEnv({
        APP_URL: "https://app.test",
        STRIPE_SECRET_KEY: "sk_test_configured",
        STRIPE_WEBHOOK_SECRET: "whsec_test_configured",
        ...overrides,
      });

      const result = isStripeConfigured();

      expect(result).toBe(true);
    });

    it.each([
      {
        label: "secret key",
        overrides: { STRIPE_SECRET_KEY: undefined },
      },
      {
        label: "webhook secret",
        overrides: { STRIPE_WEBHOOK_SECRET: undefined },
      },
      {
        label: "price and product ids",
        overrides: {
          STRIPE_PRO_PRICE_ID: undefined,
          STRIPE_PRO_PRODUCT_ID: undefined,
        },
      },
      {
        label: "base URL",
        overrides: { APP_URL: undefined },
      },
    ])("returns false when the $label is missing", ({ overrides }) => {
      mockEnv = createTestServerEnv(overrides);

      const result = isStripeConfigured();

      expect(result).toBe(false);
    });
  });

  describe("getUpgradeErrorRedirect", () => {
    it("builds an absolute upgrade redirect with an encoded error code", () => {
      const result = getUpgradeErrorRedirect(
        "checkout failed & retry",
        "https://app.test",
      );

      expect(result).toBe(
        "https://app.test/app/upgrade?error=checkout%20failed%20%26%20retry",
      );
    });
  });

  describe("getIdempotencyKeyFromRequest", () => {
    it("reads and trims a camelCase key from JSON", async () => {
      const request = buildJsonRequest(
        JSON.stringify({ idempotencyKey: "  idem_json  " }),
      );

      const result = await getIdempotencyKeyFromRequest(request);

      expect(result).toBe("idem_json");
    });

    it("reads a snake_case key from JSON", async () => {
      const request = buildJsonRequest(
        JSON.stringify({ idempotency_key: "idem_snake" }),
      );

      const result = await getIdempotencyKeyFromRequest(request);

      expect(result).toBe("idem_snake");
    });

    it("prefers the camelCase JSON key when both names are present", async () => {
      const request = buildJsonRequest(
        JSON.stringify({
          idempotencyKey: "idem_camel",
          idempotency_key: "idem_snake",
        }),
      );

      const result = await getIdempotencyKeyFromRequest(request);

      expect(result).toBe("idem_camel");
    });

    it("reads a key from a URL-encoded form", async () => {
      const request = buildUrlEncodedRequest(
        new URLSearchParams({ idempotency_key: "  idem_urlencoded  " }),
      );

      const result = await getIdempotencyKeyFromRequest(request);

      expect(result).toBe("idem_urlencoded");
    });

    it("reads a key from multipart form data", async () => {
      const formData = new FormData();
      formData.set("idempotencyKey", "idem_multipart");
      const request = buildMultipartRequest(formData);

      const result = await getIdempotencyKeyFromRequest(request);

      expect(result).toBe("idem_multipart");
    });

    it.each([
      {
        label: "empty after trimming",
        value: "   ",
      },
      {
        label: "not a string",
        value: 123,
      },
      {
        label: "longer than 255 characters",
        value: "a".repeat(256),
      },
    ])("rejects a JSON key that is $label", async ({ value }) => {
      const request = buildJsonRequest(
        JSON.stringify({ idempotencyKey: value }),
      );

      const result = await getIdempotencyKeyFromRequest(request);

      expect(result).toBeUndefined();
    });

    it("returns undefined for malformed JSON", async () => {
      const request = buildJsonRequest("{");

      const result = await getIdempotencyKeyFromRequest(request);

      expect(result).toBeUndefined();
    });

    it("returns undefined when form parsing throws", async () => {
      const request = buildUrlEncodedRequest(
        new URLSearchParams({ idempotencyKey: "idem_form" }),
      );
      jest
        .spyOn(request, "formData")
        .mockRejectedValueOnce(new Error("form parse failed"));

      const result = await getIdempotencyKeyFromRequest(request);

      expect(result).toBeUndefined();
    });

    it.each([
      {
        label: "unsupported",
        headers: { "content-type": "text/plain" },
      },
      {
        label: "missing",
        headers: undefined,
      },
    ])("returns undefined for $label content type", async ({ headers }) => {
      const request = new Request("https://app.test/api/stripe", {
        method: "POST",
        headers,
        body: "idempotencyKey=idem_ignored",
      });

      const result = await getIdempotencyKeyFromRequest(request);

      expect(result).toBeUndefined();
    });
  });

  describe("getStripe", () => {
    it("returns null when the Stripe secret key is missing", () => {
      mockEnv = createTestServerEnv({ STRIPE_SECRET_KEY: "" });

      const result = getStripe();

      expect(result).toBeNull();
      expect(mockStripeConstructor).not.toHaveBeenCalled();
    });

    it("returns a Stripe client configured for TypeScript", () => {
      mockEnv = createTestServerEnv({
        STRIPE_SECRET_KEY: "sk_test_client",
      });

      const result = getStripe();

      expect(result).toBe(mockStripeConstructor.mock.results[0]?.value);
      expect(mockStripeConstructor).toHaveBeenCalledWith("sk_test_client", {
        typescript: true,
      });
    });
  });
});
