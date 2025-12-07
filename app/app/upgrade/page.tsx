import { AlertTriangle } from "lucide-react";

import { BackLink } from "@/core/components/BackLink";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";
import { PricingTable } from "@/core/services/clerk/components/ClerkPricingTable";
import { canCreateInterview } from "@/core/features/interviews/actions";
import { Suspense } from "react";

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
  const hasPermission = await canCreateInterview();

  if (hasPermission) return null;

  return (
    <Alert variant="warning">
      <AlertTriangle />
      <AlertTitle>Plan Limit Reached</AlertTitle>
      <AlertDescription>
        You have reached the limit of your current plan. Please upgrade to
        continue using all features.
      </AlertDescription>
    </Alert>
  );
}
