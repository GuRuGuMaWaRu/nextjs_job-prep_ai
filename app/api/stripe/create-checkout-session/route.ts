import { NextResponse } from "next/server";

import {
  getStripe,
  getStripeBaseUrl,
  getIdempotencyKeyFromRequest,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import { env } from "@/core/data/env/server";
import { routes } from "@/core/data/routes";
import { getCurrentUser } from "@/core/lib/getCurrentUser";

export async function POST(request: Request) {
  const wantsJson =
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json") ?? false;

  const baseUrl = getStripeBaseUrl() ?? new URL(request.url).origin;
  //** TODO: I wonder if I need all this wantsJson stuff? */
  const createRedirectResponse = (redirectUrl: string) =>
    wantsJson
      ? NextResponse.json({ redirectUrl })
      : NextResponse.redirect(redirectUrl, 302);

  const user = await getCurrentUser();
  if (user == null) {
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=unauthorized`,
    );
  }

  //** TODO: I wonder if I need to check this? Maybe getStripe() already does this?  */
  if (!isStripeConfigured()) {
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=stripe_not_configured`,
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=stripe_not_configured`,
    );
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
    return createRedirectResponse(`${baseUrl}${routes.upgrade}?error=config`);
  }

  //** TODO: I suppose this check makes sense, yet I see no reason to combine them both into one - better write one and then another one */
  if (user.plan === "pro" || user.stripeSubscriptionId != null) {
    const errorCode =
      user.plan === "pro" ? "already_pro" : "existing_subscription";
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=${errorCode}`,
    );
  }

  //** TODO: do I need this explicit typing? */
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
    success_url: `${baseUrl}${routes.api.stripeCheckoutReturn}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}${routes.upgrade}?canceled=true`,
    metadata: { userId: user.id },
  };

  if (user.stripeCustomerId != null) {
    sessionParams.customer = user.stripeCustomerId;
  } else {
    sessionParams.customer_email = user.email;
  }

  const idempotencyKey = await getIdempotencyKeyFromRequest(request);

  try {
    //** TODO: why make idempotencyKey optional? */
    const session = await stripe.checkout.sessions.create(
      sessionParams,
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    //** TODO: should I even check for a possibility where session.url is null? */
    if (!session.url) {
      return createRedirectResponse(
        `${baseUrl}${routes.upgrade}?error=checkout_failed`,
      );
    }

    return createRedirectResponse(session.url);
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=checkout_failed`,
    );
  }
}
