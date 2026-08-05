import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { getStripe } from "@/core/features/billing/stripe";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Read-only anti-spoof check for the upgrade success banner.
 * Confirms Checkout payment and ownership via Stripe retrieve — does not write.
 *
 * @param searchParams - The search parameters from the URL.
 * @returns True when success params refer to a paid session owned by the current user.
 */
export async function checkSubscriptionSuccess(searchParams: SearchParams) {
  if (searchParams.success !== "true") return false;

  const sessionId =
    typeof searchParams.session_id === "string"
      ? searchParams.session_id
      : null;
  const stripe = getStripe();

  if (!sessionId || !stripe) {
    return false;
  }

  try {
    const user = await getCurrentUser();

    if (user == null) {
      return false;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return (
      session.payment_status === "paid" && session.metadata?.userId === user.id
    );
  } catch {
    return false;
  }
}
