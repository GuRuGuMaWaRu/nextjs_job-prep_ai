import { NextRequest, NextResponse } from "next/server";

import {
  getStripe,
  getStripeBaseUrl,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { fulfillCheckoutSession } from "@/core/features/billing/webhookHelpers";
import { routes } from "@/core/data/routes";
import { getCurrentUser } from "@/core/lib/getCurrentUser";

/**
 * Stripe Checkout success_url target: fulfills the session (DB + cache), then
 * redirects to the upgrade page. Keeps mutations out of RSC render.
 *
 * Query: `session_id` (injected by Stripe via `{CHECKOUT_SESSION_ID}`).
 */
export async function GET(request: NextRequest) {
  //** TODO: same existential question - do I need to sweat so much about getting baseUrl? */
  const baseUrl = getStripeBaseUrl() ?? new URL(request.url).origin;
  //** TODO: is it possible that Stripe won't return me a sessionId? Or is this a protection against someone else using this route?
  //** If so, later in try-catch we run 'stripe.checkout.sessions.retrieve(sessionId)' and it will throw an error if sessionId is null or invalid*/
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(
      `${baseUrl}${routes.upgrade}?error=invalid_session`,
      303,
    );
  }

  const user = await getCurrentUser();
  if (user == null) {
    return NextResponse.redirect(
      `${baseUrl}${routes.upgrade}?error=unauthorized`,
      303,
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.redirect(
      `${baseUrl}${routes.upgrade}?error=stripe_not_configured`,
      303,
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(
      `${baseUrl}${routes.upgrade}?error=stripe_not_configured`,
      303,
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const isPaidCheckoutForCurrentUser =
      session.payment_status === "paid" && session.metadata?.userId === user.id;

    if (!isPaidCheckoutForCurrentUser) {
      return NextResponse.redirect(
        `${baseUrl}${routes.upgrade}?error=invalid_session`,
        303,
      );
    }

    const fulfilled = await fulfillCheckoutSession(session);

    if (!fulfilled) {
      return NextResponse.redirect(
        `${baseUrl}${routes.upgrade}?error=fulfillment_failed`,
        303,
      );
    }

    const successUrl = `${baseUrl}${routes.upgrade}?success=true&session_id=${encodeURIComponent(sessionId)}`;

    return NextResponse.redirect(successUrl, 303);
  } catch (err) {
    console.error("Stripe checkout return fulfillment failed:", err);
    return NextResponse.redirect(
      `${baseUrl}${routes.upgrade}?error=fulfillment_failed`,
      303,
    );
  }
}
