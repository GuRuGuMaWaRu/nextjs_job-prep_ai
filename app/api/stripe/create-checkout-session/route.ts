import { NextResponse } from "next/server";

import { getCurrentUser } from "@/core/features/auth/actions";
import {
  getStripe,
  getStripeBaseUrl,
  getIdempotencyKeyFromRequest,
  getUpgradeErrorRedirect,
  isStripeConfigured,
} from "@/core/lib/stripe";
import { env } from "@/core/data/env/server";
import { routes } from "@/core/data/routes";

export async function POST(request: Request) {
  const { userId, user } = await getCurrentUser({ allData: true });
  const idempotencyKey = await getIdempotencyKeyFromRequest(request);
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
      return createRedirectResponse(getUpgradeErrorRedirect("config", baseUrl));
    }
  }

  if (!priceId) {
    return createRedirectResponse(getUpgradeErrorRedirect("config", baseUrl));
  }

  if (!user) {
    return createRedirectResponse(
      getUpgradeErrorRedirect("user_not_found", baseUrl),
    );
  }

  if (user.plan === "pro" || user.stripeSubscriptionId) {
    const errorCode =
      user.plan === "pro" ? "already_pro" : "existing_subscription";
    return createRedirectResponse(getUpgradeErrorRedirect(errorCode, baseUrl));
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
    session = await stripe.checkout.sessions.create(
      sessionParams,
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return createRedirectResponse(
      getUpgradeErrorRedirect("checkout_failed", baseUrl),
    );
  }

  if (!session.url) {
    return createRedirectResponse(
      getUpgradeErrorRedirect("checkout_failed", baseUrl),
    );
  }

  return createRedirectResponse(session.url);
}
