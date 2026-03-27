import { Suspense } from "react";

import { BackLink } from "@/core/components/BackLink";
import { PlanLimitAlert } from "@/core/components/PlanLimitAlert";
import { routes } from "@/core/data/routes";
import { canCreateInterview } from "@/core/features/interviews/actions";

import { RevalidateOnStripeReturn } from "./_RevalidateOnStripeReturn";
import { FAQSection } from "./_FAQSection";
import { WhyUpgradeSection } from "./_WhyUpgradeSection";
import { PlanCardsSection } from "./_PlanCardsSection";
import { PlanCardsSkeleton } from "./_PlanCardsSkeleton";
import { HeadlineSection, HeadlineWithPlan } from "./_HeadlineSection";
import { syncSubscriptionOnUpgradePageLoad } from "./syncSubscriptionOnLoad";
import { getErrorMessage } from "./getErrorMessage";
import { checkSubscriptionSuccess } from "./checkSubscriptionSuccess";

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
  const errorMessage = getErrorMessage(rawError);

  await syncSubscriptionOnUpgradePageLoad();

  const success = await checkSubscriptionSuccess(searchParams);

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
