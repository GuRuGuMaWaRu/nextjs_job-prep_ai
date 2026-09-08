import { NextResponse } from "next/server";

import {
  getStripe,
  getStripeBaseUrl,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { startCheckout } from "@/core/features/billing/utils";
import { env } from "@/core/data/env/server";
import { routes } from "@/core/data/routes";
import { getCurrentUser } from "@/core/lib/getCurrentUser";

export async function POST(request: Request) {
  const baseUrl = getStripeBaseUrl() ?? new URL(request.url).origin;

  const user = await getCurrentUser();
  if (user == null) {
    return NextResponse.json({
      redirectUrl: `${baseUrl}${routes.upgrade}?error=unauthorized`,
    });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({
      redirectUrl: `${baseUrl}${routes.upgrade}?error=stripe_not_configured`,
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({
      redirectUrl: `${baseUrl}${routes.upgrade}?error=stripe_not_configured`,
    });
  }

  //** TODO: should I store priceId and productId like this or in a database? */
  //** TODO: all these checks? Looks like I am not sure that I will have env variables, that defaultPrice is a string? */
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
  }

  //** TODO: again, can't I be sure there is priceId? */
  if (!priceId) {
    return NextResponse.json({
      redirectUrl: `${baseUrl}${routes.upgrade}?error=config`,
    });
  }

  //** TODO: I suppose this check makes sense, yet I see no reason to combine them both into one - better write one and then another one */
  if (user.plan === "pro" || user.stripeSubscriptionId != null) {
    const errorCode =
      user.plan === "pro" ? "already_pro" : "existing_subscription";
    return NextResponse.json({
      redirectUrl: `${baseUrl}${routes.upgrade}?error=${errorCode}`,
    });
  }

  const successUrl = `${baseUrl}${routes.api.stripeCheckoutReturn}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}${routes.upgrade}?canceled=true`;

  try {
    const stripeCheckoutUrl = await startCheckout({
      userId: user.id,
      stripePriceId: priceId,
      stripeCustomerId: user.stripeCustomerId,
      successUrl,
      cancelUrl,
      stripe,
    });

    return NextResponse.json({ redirectUrl: stripeCheckoutUrl });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return NextResponse.json({
      redirectUrl: `${baseUrl}${routes.upgrade}?error=checkout_failed`,
    });
  }
}
