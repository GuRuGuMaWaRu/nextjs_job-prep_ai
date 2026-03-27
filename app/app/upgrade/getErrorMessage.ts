/** User-facing messages for Stripe form POST error redirects. */
const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Please sign in to continue.",
  stripe_not_configured:
    "Billing is not available right now. Please try again later.",
  config: "Something went wrong. Please try again later.",
  no_subscription:
    "No active subscription found. You are already on the Free plan.",
  cancel_failed:
    "Failed to cancel subscription. Try again or use Manage subscription.",
  user_not_found: "We couldn't find your account. Please try again.",
  already_pro: "You already have an active Pro subscription.",
  existing_subscription:
    "You have an existing subscription. Use Manage subscription on this page to update payment or cancel.",
  checkout_failed: "Failed to start checkout. Please try again.",
  no_customer: "No billing customer found. Upgrade to Pro first.",
  portal_failed: "Failed to open billing portal. Please try again.",
};

type Error = string | string[] | undefined;

export function getErrorMessage(error: Error) {
  const rawError = error;
  const errorCode =
    typeof rawError === "string"
      ? rawError
      : Array.isArray(rawError)
        ? rawError[0]
        : undefined;

  return errorCode && errorCode in STRIPE_ERROR_MESSAGES
    ? STRIPE_ERROR_MESSAGES[errorCode]
    : errorCode
      ? STRIPE_ERROR_MESSAGES.config
      : null;
}
