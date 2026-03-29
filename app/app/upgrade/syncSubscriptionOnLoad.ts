import { getCurrentUser } from "@/core/features/auth/actions";
import { getUserByIdDb } from "@/core/features/users/db";
import { reconcileUserStripeSubscription } from "@/core/features/users/stripeSync";
import { getStripe, isStripeConfigured } from "@/core/lib/stripe";

/**
 * Aligns plan and Stripe subscription fields with Stripe when the user opens the
 * Upgrade page (lazy reconciliation if webhooks were missed).
 *
 * Uses a direct DB read to detect `stripeSubscriptionId` so a stale cached
 * `getUser` result cannot skip a needed sync. Errors are swallowed so the page
 * still renders; Stage 1 cron remains a backstop.
 */
export async function syncSubscriptionOnUpgradePageLoad(): Promise<void> {
  if (!isStripeConfigured()) {
    return;
  }

  const stripe = getStripe();
  if (!stripe) {
    return;
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return;
  }

  const user = await getUserByIdDb(userId);
  if (!user?.stripeSubscriptionId) {
    return;
  }

  try {
    await reconcileUserStripeSubscription(stripe, userId);
  } catch (error) {
    console.error("Error syncing subscription:", error);
    // DB updates already revalidate user tags when reconcile succeeds; keep page usable on failure.
  }
}
