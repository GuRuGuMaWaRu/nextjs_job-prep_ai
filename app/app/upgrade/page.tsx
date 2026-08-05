import { Suspense } from "react";

import { BackLink } from "@/core/components/BackLink";
import { PlanLimitAlert } from "@/core/components/PlanLimitAlert";
import { routes } from "@/core/data/routes";
import { canCreateInterviewAction } from "@/core/features/interviews/actions";

import { FAQSection } from "./_FAQSection";
import { PlanCardsSection } from "./_PlanCardsSection";
import { PlanCardsSkeleton } from "./_PlanCardsSkeleton";
import { HeadlineSection, HeadlineWithPlan } from "./_HeadlineSection";
import { getErrorMessage } from "./getErrorMessage";
import { checkSubscriptionSuccess } from "./checkSubscriptionSuccess";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpgradePage({ searchParams }: PageProps) {
  const rawSearchParams = await searchParams;

  const canceled = rawSearchParams.canceled === "true";
  const canceledSubscription = rawSearchParams.canceled_subscription === "true";
  const error = rawSearchParams.error;
  const success = await checkSubscriptionSuccess(rawSearchParams);

  return (
    <div className="container py-4 max-w-5xl">
      <div className="mb-4">
        <BackLink href={routes.app}>To Dashboard</BackLink>
      </div>

      <div className="space-y-16">
        {error && (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-800 dark:text-red-200"
            role="alert">
            {getErrorMessage(error)}
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
          {success ? null : <SuspendedAlert />}
        </Suspense>

        <Suspense fallback={<HeadlineSection currentPlan={null} />}>
          <HeadlineWithPlan />
        </Suspense>

        <Suspense fallback={<PlanCardsSkeleton />}>
          <PlanCardsSection />
        </Suspense>

        <FAQSection />
      </div>
    </div>
  );
}

async function SuspendedAlert() {
  const hasPermissionForInterviews = await canCreateInterviewAction();
  if (hasPermissionForInterviews) return null;

  return <PlanLimitAlert />;
}
