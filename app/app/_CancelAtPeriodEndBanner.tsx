"use client";

import { useReducer, useSyncExternalStore } from "react";
import { InfoIcon, XIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";

type CancelAtPeriodEndBannerProps = {
  subscriptionId: string;
  periodEndUnix?: number | null;
};

function formatPeriodEndDate(periodEndUnix: number | null | undefined): string | null {
  if (
    periodEndUnix == null ||
    !Number.isFinite(periodEndUnix) ||
    periodEndUnix <= 0
  ) {
    return null;
  }

  return new Date(periodEndUnix * 1000).toLocaleDateString(undefined, {
    dateStyle: "long",
  });
}

/**
 * Reminds users that canceled subscriptions remain Pro until period end.
 * The banner is dismissable per subscription cycle to reduce repeated noise.
 */
export function CancelAtPeriodEndBanner({
  subscriptionId,
  periodEndUnix,
}: CancelAtPeriodEndBannerProps) {
  const dismissSuffix =
    periodEndUnix != null && Number.isFinite(periodEndUnix)
      ? String(periodEndUnix)
      : "unknown";
  const dismissKey = `cancel_at_period_end_banner:${subscriptionId}:${dismissSuffix}`;

  const [, rerender] = useReducer((value: number) => value + 1, 0);

  const isDismissed = useSyncExternalStore(
    () => () => undefined,
    () => window.sessionStorage.getItem(dismissKey) === "1",
    () => true,
  );

  if (isDismissed) {
    return null;
  } 

  const moveToFreeDate = formatPeriodEndDate(periodEndUnix);
  const moveToFreeText = moveToFreeDate ? `on ${moveToFreeDate}` : "at the end of your current billing period.";
  
  return (
    <div className="container py-3">
      <Alert className="relative pr-10">
        <InfoIcon />
        <div className="space-y-1">
          <AlertTitle>Subscription canceled</AlertTitle>
          <AlertDescription>
            Your Pro plan is still active. You will move to the Free plan {moveToFreeText}
          </AlertDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 absolute top-2 right-2"
          onClick={() => {
            window.sessionStorage.setItem(dismissKey, "1");
            rerender();
          }}
          aria-label="Dismiss subscription reminder">
          <XIcon />
        </Button>
      </Alert>
    </div>
  );
}
