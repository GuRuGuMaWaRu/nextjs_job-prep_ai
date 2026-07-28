import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { reconcileUserStripeSubscription } from "@/core/features/users/stripeSync";
import { getStripe, isStripeConfigured } from "@/core/features/billing/stripe";

/**
 * Aligns plan and Stripe subscription fields with Stripe when the user opens the
 * Upgrade page (lazy reconciliation if webhooks were missed).
 */
export async function syncSubscriptionOnUpgradePageLoad(): Promise<void> {
  try {
    if (!isStripeConfigured()) {
      return;
    }

    const stripe = getStripe();
    if (!stripe) {
      return;
    }

    const user = await getCurrentUser();

    if (user == null || user.stripeSubscriptionId == null) {
      return;
    }

    await reconcileUserStripeSubscription(stripe, user.id);
  } catch (error) {
    console.error("Error syncing subscription:", error);
    // Revalidation runs in RevalidateOnStripeReturn after redirect, not during render.
  }
}
