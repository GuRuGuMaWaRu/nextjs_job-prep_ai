import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getCurrentUserWithProfile } from "@/core/features/auth/actions";
import {
  getStripe,
  getStripeBaseUrl,
  getIdempotencyKeyFromRequest,
  getUpgradeErrorRedirect,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { routes } from "@/core/data/routes";

export async function POST(request: Request) {
  const { userId, user } = await getCurrentUserWithProfile();
  const idempotencyKey = await getIdempotencyKeyFromRequest(request);
  const wantsJson =
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json") ?? false;

  const baseUrl = getStripeBaseUrl() ?? new URL(request.url).origin;
  const createRedirectResponse = (redirectUrl: string) =>
    wantsJson
      ? NextResponse.json({ redirectUrl })
      : NextResponse.redirect(redirectUrl, 302);

  if (!userId) {
    return createRedirectResponse(
      getUpgradeErrorRedirect("unauthorized", baseUrl),
    );
  }

  if (!isStripeConfigured()) {
    return createRedirectResponse(
      getUpgradeErrorRedirect("stripe_not_configured", baseUrl),
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return createRedirectResponse(
      getUpgradeErrorRedirect("stripe_not_configured", baseUrl),
    );
  }

  if (!user?.stripeCustomerId) {
    return createRedirectResponse(
      getUpgradeErrorRedirect("no_customer", baseUrl),
    );
  }

  const returnUrl = `${baseUrl}${routes.upgrade}`;

  let portalSession: Stripe.BillingPortal.Session;
  try {
    portalSession = await stripe.billingPortal.sessions.create(
      {
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  } catch (err) {
    console.error("Stripe portal session creation failed:", err);
    return createRedirectResponse(
      getUpgradeErrorRedirect("portal_failed", baseUrl),
    );
  }

  if (!portalSession.url) {
    return createRedirectResponse(
      getUpgradeErrorRedirect("portal_failed", baseUrl),
    );
  }

  return createRedirectResponse(portalSession.url);
}
