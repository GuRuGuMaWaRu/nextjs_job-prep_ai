import { NextResponse } from "next/server";

import {
  getStripe,
  getStripeBaseUrl,
  getIdempotencyKeyFromRequest,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { routes } from "@/core/data/routes";
import { getCurrentUser } from "@/core/lib/getCurrentUser";

export async function POST(request: Request) {
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

  const user = await getCurrentUser();
  if (user == null) {
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=unauthorized`,
    );
  }

  if (!isStripeConfigured()) {
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=stripe_not_configured`,
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=stripe_not_configured`,
    );
  }

  if (user.stripeCustomerId == null) {
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=no_customer`,
    );
  }

  const idempotencyKey = await getIdempotencyKeyFromRequest(request);

  try {
    const portalSession = await stripe.billingPortal.sessions.create(
      {
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}${routes.upgrade}`,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    if (!portalSession.url) {
      return createRedirectResponse(
        `${baseUrl}${routes.upgrade}?error=portal_failed`,
      );
    }

    return createRedirectResponse(portalSession.url);
  } catch (err) {
    console.error("Stripe portal session creation failed:", err);
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=portal_failed`,
    );
  }
}
