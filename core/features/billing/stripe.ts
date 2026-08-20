import Stripe from "stripe";

import { env } from "@/core/data/env/server";

let stripeInstance: Stripe | null = null;
const IDEMPOTENCY_KEY_MAX_LENGTH = 255;

/**
 * Returns a Stripe client when Stripe is configured. Use in checkout and
 * webhook routes; they must return an error response when this is null.
 */
export function getStripe(): Stripe | null {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) return null;

  if (!stripeInstance) {
    stripeInstance = new Stripe(key, { typescript: true });
  }

  return stripeInstance;
}

/**
 * Base URL for success/cancel redirects.
 * Prefers APP_URL, then VERCEL_URL. Falls back to localhost only in development;
 * returns null in non-dev environments so callers fail closed rather than
 * redirecting Stripe to a dead address.
 */
//** TODO: should be simplified */
//** TODO: I may be wrong, but why does it have 'Stripe' in the name if it returns a base URL for the app? */
export function getStripeBaseUrl(): string | null {
  if (env.APP_URL) return env.APP_URL;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return null;
}

//** TODO: I don't like this function and want it gone; we should be checking env variables on app load */
export function isStripeConfigured(): boolean {
  const hasPriceOrProduct =
    env.STRIPE_PRO_PRICE_ID || env.STRIPE_PRO_PRODUCT_ID;

  return Boolean(
    env.STRIPE_SECRET_KEY &&
      env.STRIPE_WEBHOOK_SECRET &&
      hasPriceOrProduct &&
      getStripeBaseUrl(),
  );
}

function getNormalizedIdempotencyKey(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const key = value.trim();
  if (!key || key.length > IDEMPOTENCY_KEY_MAX_LENGTH) return undefined;

  return key;
}

/**
 * Reads idempotency key from JSON or form payloads and returns a validated key.
 * Invalid payloads and parse failures intentionally return undefined.
 */
export async function getIdempotencyKeyFromRequest(
  request: Request,
): Promise<string | undefined> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        idempotencyKey?: unknown;
        idempotency_key?: unknown;
      } | null;

      return getNormalizedIdempotencyKey(
        body?.idempotencyKey ?? body?.idempotency_key,
      );
    }

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      return getNormalizedIdempotencyKey(
        formData.get("idempotencyKey") ?? formData.get("idempotency_key"),
      );
    }
  } catch {
    return undefined;
  }

  return undefined;
}
