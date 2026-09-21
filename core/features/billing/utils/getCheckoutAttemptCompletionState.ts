import Stripe from "stripe";

export function getCheckoutAttemptCompletionState(
  sessionData: Pick<Stripe.Checkout.Session, "status" | "payment_status">,
) {
  if (sessionData.status !== "complete") {
    return null;
  }

  if (
    sessionData.status === "complete" &&
    sessionData.payment_status === "unpaid"
  ) {
    return "payment_pending";
  }

  if (
    sessionData.status === "complete" &&
    (sessionData.payment_status === "paid" ||
      sessionData.payment_status === "no_payment_required")
  ) {
    return "completed";
  }

  return null;
}
