import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";

export function PlanLimitAlert({
  hasRedirectButton = false,
}: {
  hasRedirectButton?: boolean;
}) {
  return (
    <Alert variant="warning">
      <AlertTriangle />
      <AlertTitle>Plan Limit Reached</AlertTitle>
      <AlertDescription>
        You have reached the limit of your current plan. Please upgrade to
        continue using all features.
        {hasRedirectButton ? (
          <Button size="sm" asChild className="mt-3 ml-auto">
            <Link href="/app/upgrade">Upgrade</Link>
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
