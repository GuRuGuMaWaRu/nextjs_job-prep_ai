import { Suspense } from "react";

import { BackLink } from "@/core/components/BackLink";
import { PlanLimitAlert } from "@/core/components/PlanLimitAlert";
import { routes } from "@/core/data/routes";
import { canCreateInterview } from "@/core/features/interviews/actions";
import { getCurrentUser } from "@/core/features/auth/actions";
import { getStripe } from "@/core/lib/stripe";

import { RevalidateOnStripeReturn } from "./RevalidateOnStripeReturn";
import { FAQSection } from "./FAQSection";
import { WhyUpgradeSection } from "./WhyUpgradeSection";
import { PlanCardsSection } from "./PlanCardsSection";
import { PlanCardsSkeleton } from "./PlanCardsSkeleton";
import { HeadlineSection, HeadlineWithPlan } from "./HeadlineSection";

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

type UpgradePageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function UpgradePage(props: UpgradePageProps) {
  const rawParams = props.searchParams ?? {};
  const searchParams =
    rawParams instanceof Promise ? await rawParams : rawParams;
  const canceled = searchParams.canceled === "true";
  const canceledSubscription = searchParams.canceled_subscription === "true";

  const rawError = searchParams.error;
  const errorCode =
    typeof rawError === "string"
      ? rawError
      : Array.isArray(rawError)
        ? rawError[0]
        : undefined;
  const errorMessage =
    errorCode && STRIPE_ERROR_MESSAGES[errorCode]
      ? STRIPE_ERROR_MESSAGES[errorCode]
      : errorCode
        ? STRIPE_ERROR_MESSAGES.config
        : null;

  let success = false;
  if (searchParams.success === "true") {
    const sessionId =
      typeof searchParams.session_id === "string"
        ? searchParams.session_id
        : null;
    const stripe = getStripe();

    if (sessionId && stripe) {
      try {
        const { userId } = await getCurrentUser();
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        success =
          session.payment_status === "paid" &&
          !!userId &&
          session.metadata?.userId === userId;
      } catch {
        // Invalid or expired session — don't show the success banner.
      }
    }
  }

  return (
    <div className="container py-4 max-w-5xl">
      <RevalidateOnStripeReturn
        success={success}
        canceled={canceled}
        canceledSubscription={canceledSubscription}
      />
      <div className="mb-4">
        <BackLink href={routes.app}>To Dashboard</BackLink>
      </div>

      <div className="space-y-16">
        {errorMessage && (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-800 dark:text-red-200"
            role="alert">
            {errorMessage}
          </div>
        )}
        {success && (
          <div
            className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-center text-sm text-green-800 dark:text-green-200"
            role="alert">
            You&apos;re now on the <strong>Pro</strong> plan. Thank you for
            upgrading!
          </div>
        )}
        {canceled && (
          <div
            className="rounded-lg border border-muted-foreground/30 bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground"
            role="status">
            Checkout was canceled. You can try again whenever you&apos;re ready.
          </div>
        )}
        {canceledSubscription && (
          <div
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-800 dark:text-amber-200"
            role="status">
            You&apos;ve canceled your subscription. You&apos;ll keep Pro until
            the end of your billing period, then you&apos;ll be on the Free
            plan.
          </div>
        )}

        <Suspense fallback={null}>
          <SuspendedAlert />
        </Suspense>

        <Suspense fallback={<HeadlineSection currentPlan={null} />}>
          <HeadlineWithPlan />
        </Suspense>

        <Suspense fallback={<PlanCardsSkeleton />}>
          <PlanCardsSection />
        </Suspense>

        <WhyUpgradeSection />

        <FAQSection />
      </div>
    </div>
  );
}

async function SuspendedAlert() {
  const hasPermissionForInterviews = await canCreateInterview();
  if (hasPermissionForInterviews) return null;

  return <PlanLimitAlert />;
}
