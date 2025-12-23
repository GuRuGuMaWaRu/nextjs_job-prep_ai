import { Suspense } from "react";

import { BackLink } from "@/core/components/BackLink";
import { PlanLimitAlert } from "@/core/components/PlanLimitAlert";
import { routes } from "@/core/data/routes";
import { canCreateInterview } from "@/core/features/interviews/actions";

export default function UpgradePage() {
  return (
    <div className="container py-4 max-w-5xl">
      <div className="mb-4">
        <BackLink href={routes.app}>To Dashboard</BackLink>
      </div>

      <div className="space-y-16">
        <Suspense fallback={null}>
          <SuspendedAlert />
        </Suspense>
        {/* TODO: Implement pricing table in Phase 5 */}
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Upgrade Plans</h2>
          <p className="text-muted-foreground">
            Pricing plans will be available soon. Currently, all features are
            available to all users.
          </p>
        </div>
      </div>
    </div>
  );
}

async function SuspendedAlert() {
  const hasPermissionForInterviews = await canCreateInterview();
  if (hasPermissionForInterviews) return null;

  return <PlanLimitAlert />;
}
