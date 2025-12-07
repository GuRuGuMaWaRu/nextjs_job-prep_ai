import { AlertTriangle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";

export function PlanLimitAlert() {
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
