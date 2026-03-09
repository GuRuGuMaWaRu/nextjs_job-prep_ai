import Stripe from "stripe";

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
 * Base URL for success/cancel redirects. Prefers APP_URL, then Vercel, then localhost.
 */
export function getStripeBaseUrl(): string {
  if (env.APP_URL) return env.APP_URL;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export function isStripeConfigured(): boolean {
  const hasPriceOrProduct =
    env.STRIPE_PRO_PRICE_ID || env.STRIPE_PRO_PRODUCT_ID;

  return Boolean(
    env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && hasPriceOrProduct,
  );
}
