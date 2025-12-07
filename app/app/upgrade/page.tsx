import { AlertTriangle } from "lucide-react";

import { BackLink } from "@/core/components/BackLink";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";
import { PricingTable } from "@/core/services/clerk/components/ClerkPricingTable";

export default function UpgradePage() {
  return (
    <div className="container py-4 max-w-5xl">
      <div className="mb-4">
        <BackLink href="/app">To Dashboard</BackLink>
      </div>

      <div className="space-y-16">
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>Plan Limit Reached</AlertTitle>
          <AlertDescription>
            You have reached the limit of your current plan. Please upgrade to
            continue using all features.
          </AlertDescription>
        </Alert>

        <PricingTable />
      </div>
    </div>
  );
}
