import { NextResponse } from "next/server";

import { getCurrentUser } from "@/core/features/auth/actions";
import { getUser } from "@/core/features/users/actions";
import {
  getStripe,
  getStripeBaseUrl,
  getUpgradeErrorRedirect,
  isStripeConfigured,
} from "@/core/lib/stripe";
import { env } from "@/core/data/env/server";
import { routes } from "@/core/data/routes";

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
      return NextResponse.redirect(
        getUpgradeErrorRedirect("config", baseUrl),
        302,
      );
    }
  }

  if (!priceId) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("config", baseUrl),
      302,
    );
  }

  const user = await getUser(userId);
  if (!user) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("user_not_found", baseUrl),
      302,
    );
  }

  if (user.plan === "pro" || user.stripeSubscriptionId) {
    const errorCode =
      user.plan === "pro" ? "already_pro" : "existing_subscription";
    return NextResponse.redirect(
      getUpgradeErrorRedirect(errorCode, baseUrl),
      302,
    );
  }

  if (!baseUrl) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("config", baseUrl),
      302,
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
    return NextResponse.redirect(
      getUpgradeErrorRedirect("checkout_failed", baseUrl),
      302,
    );
  }

  if (!session.url) {
    return NextResponse.redirect(
      getUpgradeErrorRedirect("checkout_failed", baseUrl),
      302,
    );
  }

  return NextResponse.redirect(session.url, 302);
}
