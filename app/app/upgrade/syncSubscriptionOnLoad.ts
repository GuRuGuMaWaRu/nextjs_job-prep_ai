import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getUserByIdDb } from "@/core/features/users/db";
import { reconcileUserStripeSubscription } from "@/core/features/users/stripeSync";
import { getStripe, isStripeConfigured } from "@/core/features/billing/stripe";

/**
 * Aligns plan and Stripe subscription fields with Stripe when the user opens the
 * Upgrade page (lazy reconciliation if webhooks were missed).
 *
 * Uses a direct DB read to detect `stripeSubscriptionId` so a stale cached
 * `getUserAction` result cannot skip a needed sync. Returns whether the DB was
 * changed so a client effect can revalidate cached plan data after render.
 * Errors are swallowed so the page still renders; Stage 1 cron remains a backstop.
 */
export async function syncSubscriptionOnUpgradePageLoad(): Promise<boolean> {
  try {
    if (!isStripeConfigured()) {
      return false;
    }

    const stripe = getStripe();
    if (!stripe) {
      return false;
    }

    const { userId } = await getCurrentUserAction();
    if (!userId) {
      return false;
    }

    const user = await getUserByIdDb(userId);
    if (!user?.stripeSubscriptionId) {
      return false;
    }

    const result = await reconcileUserStripeSubscription(stripe, userId);

    return result.kind === "ok" && result.updated;
  } catch (error) {
    console.error("Error syncing subscription:", error);
    // Revalidation runs in a client effect after render, not during render.
    return false;
  }
}
