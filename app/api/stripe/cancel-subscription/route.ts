import { NextResponse } from "next/server";

import { getCurrentUser } from "@/core/features/auth/actions";
import { getUser } from "@/core/features/users/actions";
import {
  getStripe,
  getStripeBaseUrl,
  getUpgradeErrorRedirect,
  isStripeConfigured,
} from "@/core/lib/stripe";
import { routes } from "@/core/data/routes";

/**
 * Cancels the current user's Pro subscription at the end of the billing period.
 * The user keeps Pro until then; the webhook will set plan to free when the
 * subscription ends.
 */
export async function POST() {
  const { userId } = await getCurrentUser();

  const baseUrl = getStripeBaseUrl();

  if (!userId) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("unauthorized", baseUrl),
      302,
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("stripe_not_configured", baseUrl),
      302,
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("stripe_not_configured", baseUrl),
      302,
    );
  }

  if (!baseUrl) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("config", baseUrl),
      302,
    );
  }

  const user = await getUser(userId);
  if (!user?.stripeSubscriptionId) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("no_subscription", baseUrl),
      302,
    );
  }

  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (err) {
    console.error("Stripe cancel subscription error:", err);
    return NextResponse.redirect(
      getUpgradeErrorRedirect("cancel_failed", baseUrl),
      302,
    );
  }

  const redirectUrl = `${baseUrl}${routes.upgrade}?canceled_subscription=true`;

  return NextResponse.redirect(redirectUrl, 302);
}
