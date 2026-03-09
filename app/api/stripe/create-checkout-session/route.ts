import { NextResponse } from "next/server";

import { getCurrentUser } from "@/core/features/auth/actions";
import { getUser } from "@/core/features/users/actions";
import {
  getStripe,
  getStripeBaseUrl,
  isStripeConfigured,
} from "@/core/lib/stripe";
import { env } from "@/core/data/env/server";
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

  let priceId = env.STRIPE_PRO_PRICE_ID;

  if (!priceId && env.STRIPE_PRO_PRODUCT_ID) {
    const product = await stripe.products.retrieve(env.STRIPE_PRO_PRODUCT_ID, {
      expand: ["default_price"],
    });
    const defaultPrice = product.default_price;

    priceId =
      typeof defaultPrice === "string"
        ? defaultPrice
        : (defaultPrice?.id ?? undefined);

    if (!priceId) {
      return new NextResponse(
        "Pro product has no default price. Add a price in Stripe Dashboard or set STRIPE_PRO_PRICE_ID.",
        { status: 503 },
      );
    }
  }

  if (!priceId) {
    return new NextResponse(
      "Set STRIPE_PRO_PRICE_ID (price_...) or STRIPE_PRO_PRODUCT_ID (prod_...) in .env",
      { status: 503 },
    );
  }

  const user = await getUser(userId);
  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  if (user.plan === "pro" || user.stripeSubscriptionId) {
    const message =
      user.plan === "pro"
        ? "You already have an active Pro subscription."
        : "You have an existing subscription that needs attention. Use \"Manage subscription\" on the Upgrade page to update your payment method or cancel.";

    return new NextResponse(message, { status: 409 });
  }

  const baseUrl = getStripeBaseUrl();
  if (!baseUrl) {
    return new NextResponse(
      "APP_URL is not configured. Set APP_URL in .env for Stripe redirects.",
      { status: 503 },
    );
  }

  const successUrl = `${baseUrl}${routes.upgrade}?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}${routes.upgrade}?canceled=true`;

  const sessionParams: {
    mode: "subscription";
    line_items: [{ price: string; quantity: number }];
    success_url: string;
    cancel_url: string;
    metadata: { userId: string };
    customer?: string;
    customer_email?: string;
  } = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  };

  if (user.stripeCustomerId) {
    sessionParams.customer = user.stripeCustomerId;
  } else {
    sessionParams.customer_email = user.email;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create(sessionParams);
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return new NextResponse(
      "Failed to create checkout session. Please try again.",
      { status: 500 },
    );
  }

  if (!session.url) {
    return new NextResponse("Failed to create checkout session", {
      status: 500,
    });
  }

  return NextResponse.redirect(session.url, 302);
}
