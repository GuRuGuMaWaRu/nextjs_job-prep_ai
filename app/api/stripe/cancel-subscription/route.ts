import { NextResponse } from "next/server";

import { getCurrentUser } from "@/core/features/auth/actions";
import { getUser } from "@/core/features/users/actions";
import {
  getStripe,
  getStripeBaseUrl,
  getIdempotencyKeyFromRequest,
  getUpgradeErrorRedirect,
  isStripeConfigured,
} from "@/core/lib/stripe";
import { routes } from "@/core/data/routes";

/**
 * Cancels the current user's Pro subscription at the end of the billing period.
 * The user keeps Pro until then; the webhook will set plan to free when the
 * subscription ends.
 */
export async function POST(request: Request) {
  const { userId } = await getCurrentUser();
  const idempotencyKey = await getIdempotencyKeyFromRequest(request);
  const wantsJson =
    request.headers.get("content-type")?.toLowerCase().includes("application/json") ??
    false;

  const baseUrl =
    getStripeBaseUrl() ?? new URL(request.url).origin;
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

  const user = await getUser(userId);
  if (!user?.stripeSubscriptionId) {
    return createRedirectResponse(
      getUpgradeErrorRedirect("no_subscription", baseUrl),
    );
  }

  try {
    await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  } catch (err) {
    console.error("Stripe cancel subscription error:", err);
    return createRedirectResponse(
      getUpgradeErrorRedirect("cancel_failed", baseUrl),
    );
  }

  const redirectUrl = `${baseUrl}${routes.upgrade}?canceled_subscription=true`;

  return createRedirectResponse(redirectUrl);
}
