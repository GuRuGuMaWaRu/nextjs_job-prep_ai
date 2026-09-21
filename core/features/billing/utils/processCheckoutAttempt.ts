import Stripe from "stripe";

import { getCheckoutAttemptCompletionState } from "./getCheckoutAttemptCompletionState";
import { recordCheckoutPaymentPending } from "./recordCheckoutPaymentPending";
import { recordCheckoutCompleted } from "./recordCheckoutCompleted";

export async function processCheckoutAttempt(session: Stripe.Checkout.Session) {
  const checkoutAttemptId = session.metadata?.checkoutAttemptId;

  if (checkoutAttemptId == null) {
    return null;
  }

  const completionState = getCheckoutAttemptCompletionState({
    status: session.status,
    payment_status: session.payment_status,
  });

  let updatedRecord = null;

  if (completionState === "payment_pending") {
    updatedRecord = await recordCheckoutPaymentPending({
      checkoutAttemptId,
      stripeSessionId: session.id,
    });
  }

  if (completionState === "completed") {
    updatedRecord = await recordCheckoutCompleted({
      checkoutAttemptId,
      stripeSessionId: session.id,
    });
  }

  return updatedRecord;
}
