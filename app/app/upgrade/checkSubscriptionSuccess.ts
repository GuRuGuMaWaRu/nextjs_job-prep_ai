import { getCurrentUser } from "@/core/features/auth/helpers";
import { getStripe } from "@/core/features/billing/stripe";
import { fulfillCheckoutSession } from "@/core/features/billing/webhookHelpers";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Prevents spoofed upgrade success states by confirming Checkout payment and ownership server-side.
 * @param searchParams - The search parameters from the URL.
 * @returns True if the subscription is successful, false otherwise.
 */
export async function checkSubscriptionSuccess(searchParams: SearchParams) {
  if (searchParams.success !== "true") return false;

  const sessionId =
    typeof searchParams.session_id === "string"
      ? searchParams.session_id
      : null;
  const stripe = getStripe();

  if (sessionId && stripe) {
    try {
      const { user } = await getCurrentUser();
      if (user == null) return false;

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const isPaidCheckoutForCurrentUser =
        session.payment_status === "paid" &&
        session.metadata?.userId === user.id;

      if (!isPaidCheckoutForCurrentUser) {
        return false;
      }

      return await fulfillCheckoutSession(session);
    } catch {
      return false;
    }
  }

  return false;
}
