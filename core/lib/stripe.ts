import Stripe from "stripe";

import { routes } from "@/core/data/routes";
import { env } from "@/core/data/env/server";

let stripeInstance: Stripe | null = null;

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
export function getStripeBaseUrl(): string | null {
  if (env.APP_URL) return env.APP_URL;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return null;
}

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

/**
 * Builds the upgrade page URL with an optional error code for redirect-on-error.
 * Use when form POST handlers (checkout, portal, cancel) fail so the user is
 * sent back to the upgrade page with a message instead of a raw text response.
 */
export function getUpgradeErrorRedirect(
  errorCode: string,
  baseUrl: string | null,
): string {
  const query = `?error=${encodeURIComponent(errorCode)}`;
  if (baseUrl) return `${baseUrl}${routes.upgrade}${query}`;
  return `${routes.upgrade}${query}`;
}
