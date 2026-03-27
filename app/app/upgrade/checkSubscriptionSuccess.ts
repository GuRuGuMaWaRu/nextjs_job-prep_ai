import { getCurrentUser } from "@/core/features/auth/actions";
import { getStripe } from "@/core/lib/stripe";

type SearchParams = Record<string, string | string[] | undefined>;

export async function checkSubscriptionSuccess(searchParams: SearchParams) {
  if (searchParams.success !== "true") return false;

  const sessionId =
    typeof searchParams.session_id === "string"
      ? searchParams.session_id
      : null;
  const stripe = getStripe();

  if (sessionId && stripe) {
    try {
      const { userId } = await getCurrentUser();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      return (
        session.payment_status === "paid" &&
        !!userId &&
        session.metadata?.userId === userId
      );
    } catch {
      return false;
    }
  }

  return false;
}
