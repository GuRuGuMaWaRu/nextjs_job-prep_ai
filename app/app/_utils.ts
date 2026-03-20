import { getStripe } from "@/core/lib/stripe";
import type { AuthUser } from "@/core/features/auth/types";

type CanceledSubscriptionNotice = {
  subscriptionId: string;
  periodEndUnix: number | null;
};

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
