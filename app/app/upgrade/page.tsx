import { Suspense } from "react";

import { BackLink } from "@/core/components/BackLink";
import { PlanLimitAlert } from "@/core/components/PlanLimitAlert";
import { canCreateInterview } from "@/core/features/interviews/actions";
import { PricingTable } from "@/core/services/clerk/components/ClerkPricingTable";

export default function UpgradePage() {
  return (
    <div className="container py-4 max-w-5xl">
      <div className="mb-4">
        <BackLink href="/app">To Dashboard</BackLink>
      </div>

      <div className="space-y-16">
        <Suspense fallback={null}>
          <SuspendedAlert />
        </Suspense>
        <PricingTable />
      </div>
    </div>
  );
}

async function SuspendedAlert() {
  const hasPermissionForInterviews = await canCreateInterview();
  if (hasPermissionForInterviews) return null;

  return <PlanLimitAlert />;
}
