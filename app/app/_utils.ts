import type { AuthUser } from "@/core/features/auth/types";
import { getStripe } from "@/core/features/billing/stripe";

type CanceledSubscriptionNotice = {
  subscriptionId: string;
  periodEndUnix: number | null;
};

/**
 * Retrieves cancellation notice details for a Pro user's Stripe subscription.
 *
 * @param user - Authenticated user with `plan` and optional `stripeSubscriptionId`.
 * @returns Stripe subscription id and scheduled cancel time when the subscription is still
 *   active but `cancel_at_period_end` is set, and the cancel time is still in the future if known;
 *   otherwise `null`.
 */
async function getCanceledSubscriptionNotice(
  user: AuthUser,
): Promise<CanceledSubscriptionNotice | null> {
  if (user.plan !== "pro") return null;
  if (!user.stripeSubscriptionId) return null;

  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );

    if (!subscription.cancel_at_period_end) return null;

    const hasValidPeriodEnd =
      Number.isFinite(subscription.cancel_at) &&
      subscription.cancel_at != null &&
      subscription.cancel_at > 0;
    const periodEndUnix = hasValidPeriodEnd ? subscription.cancel_at : null;

    if (periodEndUnix != null) {
      const nowUnix = Math.floor(Date.now() / 1000);
      if (periodEndUnix <= nowUnix) return null;
    }

    return {
      subscriptionId: subscription.id,
      periodEndUnix,
    };
  } catch {
    return null;
  }
}

export { getCanceledSubscriptionNotice };
