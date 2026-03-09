import { NextResponse } from "next/server";

import { getCurrentUser } from "@/core/features/auth/actions";
import { getUser } from "@/core/features/users/actions";
import {
  getStripe,
  getStripeBaseUrl,
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

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!isStripeConfigured()) {
    return new NextResponse("Stripe is not configured", { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return new NextResponse("Stripe is not configured", { status: 503 });
  }

  const user = await getUser(userId);
  if (!user?.stripeSubscriptionId) {
    return new NextResponse(
      "No active subscription found. You are already on the Free plan.",
      { status: 400 },
    );
  }

  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (err) {
    console.error("Stripe cancel subscription error:", err);
    return new NextResponse(
      "Failed to cancel subscription. Try again or use Manage subscription.",
      { status: 500 },
    );
  }

  const baseUrl = getStripeBaseUrl();
  if (!baseUrl) {
    return new NextResponse(
      "APP_URL is not configured. Set APP_URL in .env for Stripe redirects.",
      { status: 503 },
    );
  }

  const redirectUrl = `${baseUrl}${routes.upgrade}?canceled_subscription=true`;

  return NextResponse.redirect(redirectUrl, 302);
}
