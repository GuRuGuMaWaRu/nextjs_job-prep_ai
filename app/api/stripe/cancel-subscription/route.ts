import { NextResponse } from "next/server";

import {
  getStripe,
  getStripeBaseUrl,
  getIdempotencyKeyFromRequest,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { routes } from "@/core/data/routes";
import { getCurrentUser } from "@/core/lib/getCurrentUser";

/**
 * Cancels the current user's Pro subscription at the end of the billing period.
 * The user keeps Pro until then; the webhook will set plan to free when the
 * subscription ends.
 */
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

  if (user.stripeSubscriptionId == null) {
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=no_subscription`,
    );
  }

  const idempotencyKey = await getIdempotencyKeyFromRequest(request);

  try {
    await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?canceled_subscription=true`,
    );
  } catch (err) {
    console.error("Stripe cancel subscription error:", err);
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=cancel_failed`,
    );
  }
}
