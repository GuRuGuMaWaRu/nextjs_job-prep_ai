import { NextResponse } from "next/server";

import { getCurrentUser } from "@/core/features/auth/actions";
import { getUser } from "@/core/features/users/actions";
import {
  getStripe,
  getStripeBaseUrl,
  isStripeConfigured,
} from "@/core/lib/stripe";
import { routes } from "@/core/data/routes";

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
  if (!user?.stripeCustomerId) {
    return new NextResponse(
      "No billing customer found. Upgrade to Pro first.",
      { status: 400 },
    );
  }

  const baseUrl = getStripeBaseUrl();
  const returnUrl = `${baseUrl}${routes.upgrade}`;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });

  if (!portalSession.url) {
    return new NextResponse("Failed to create portal session", {
      status: 500,
    });
  }

  return NextResponse.redirect(portalSession.url, 302);
}
