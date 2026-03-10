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

export async function POST(request: Request) {
  const { userId } = await getCurrentUser();
  const idempotencyKey = await getIdempotencyKeyFromRequest(request);

  const baseUrl =
    getStripeBaseUrl() ?? new URL(request.url).origin;

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

  const user = await getUser(userId);
  if (!user?.stripeCustomerId) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("no_customer", baseUrl),
      302,
    );
  }

  const returnUrl = `${baseUrl}${routes.upgrade}`;

  let portalSession;
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
    return NextResponse.redirect(
      getUpgradeErrorRedirect("portal_failed", baseUrl),
      302,
    );
  }

  if (!portalSession.url) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("portal_failed", baseUrl),
      302,
    );
  }

  return NextResponse.redirect(portalSession.url, 302);
}
