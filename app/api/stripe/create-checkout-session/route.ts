import { NextResponse } from "next/server";

import {
  getStripe,
  getStripeBaseUrl,
  isStripeConfigured,
} from "@/core/features/billing/stripe";
import {
  getOrCreateActiveCheckoutAttempt,
  saveCheckoutSession,
} from "@/core/features/billing/utils";
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

  const successUrl = `${baseUrl}${routes.api.stripeCheckoutReturn}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}${routes.upgrade}?canceled=true`;

  try {
    const checkoutAttempt = await getOrCreateActiveCheckoutAttempt({
      userId: user.id,
      stripePriceId: priceId,
      successUrl,
      cancelUrl,
      stripeCustomerId: user.stripeCustomerId,
    });

    if (
      checkoutAttempt.status === "open" &&
      checkoutAttempt.stripeSessionId &&
      checkoutAttempt.stripeCheckoutUrl &&
      checkoutAttempt.stripeExpiresAt &&
      checkoutAttempt.stripeExpiresAt.getTime() > Date.now()
    ) {
      return createRedirectResponse(checkoutAttempt.stripeCheckoutUrl);
    }

    if (checkoutAttempt.status === "open") {
      throw new Error(
        "Open checkout attempt has missing or expired session data",
      );
    }

    if (checkoutAttempt.status !== "creating") {
      throw new Error(
        "Checkout attempt cannot create a session in its current state",
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
    } = {
      mode: "subscription",
      line_items: [{ price: checkoutAttempt.stripePriceId, quantity: 1 }],
      success_url: checkoutAttempt.successUrl,
      cancel_url: checkoutAttempt.cancelUrl,
      metadata: { userId: checkoutAttempt.userId },
    };

    if (checkoutAttempt.stripeCustomerId != null) {
      sessionParams.customer = checkoutAttempt.stripeCustomerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey: `checkout_attempt_${checkoutAttempt.id}`,
    });

    //** TODO: should I even check for a possibility where session.url is null? */
    if (!session.url) {
      throw new Error();
    }

    await saveCheckoutSession(checkoutAttempt.id, {
      stripeSessionId: session.id,
      stripeCheckoutUrl: session.url,
      stripeExpiresAt: session.expires_at,
    });

    return createRedirectResponse(session.url);
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return createRedirectResponse(
      `${baseUrl}${routes.upgrade}?error=checkout_failed`,
    );
  }
}
